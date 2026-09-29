package com.fabrica.ecommerce.service;

import com.fabrica.ecommerce.exception.InsufficientStockException;
import com.fabrica.ecommerce.model.*;
import com.fabrica.ecommerce.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Control de stock por variante (talle): consumo FIFO de lotes al confirmar,
 * cálculo de costo y devolución de stock al eliminar un pedido.
 */
@ExtendWith(MockitoExtension.class)
class OrderServiceStockTest {

    @Mock OrderRepository orderRepository;
    @Mock OrderItemRepository orderItemRepository;
    @Mock InventoryBatchRepository inventoryBatchRepository;
    @Mock MetaConversionsService metaConversionsService;
    @Mock OrderItemBatchAllocationRepository allocationRepository;
    @Mock ProductRepository productRepository;
    @Mock EmailService emailService;

    @InjectMocks OrderService orderService;

    private Product product;
    private Order order;

    @BeforeEach
    void setUp() {
        product = new Product();
        product.setId(10L);
        product.setSku("PARRILLA-01");
        product.setSalePrice(new BigDecimal("1000.00"));

        order = new Order();
        order.setId(1L);
        order.setOrderCode("PED-123");
        order.setCustomerContact("Juan | juan@example.com");
        order.setStatus(Order.OrderStatus.PENDING);
        order.setTotalSaleAmount(new BigDecimal("3000.00"));

        lenient().when(orderRepository.findByOrderCode("PED-123")).thenReturn(Optional.of(order));
        lenient().when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void confirmOrder_consumesBatchesFifoOnlyForRequestedSize() {
        OrderItem item = item(3, "L");
        InventoryBatch older = batch(1L, "L", 2, "100.00");
        InventoryBatch newer = batch(2L, "L", 5, "130.00");
        when(orderItemRepository.findByOrderId(1L)).thenReturn(List.of(item));
        when(inventoryBatchRepository.findAvailableBatchesForProductAndSize(10L, "L"))
                .thenReturn(List.of(older, newer));

        Order result = orderService.confirmOrder("PED-123");

        verify(inventoryBatchRepository).findAvailableBatchesForProductAndSize(10L, "L");
        verify(inventoryBatchRepository, never()).findAvailableBatchesForProduct(anyLong());
        assertThat(older.getQuantityRemaining()).isZero();
        assertThat(newer.getQuantityRemaining()).isEqualTo(4);

        // 2 x 100 + 1 x 130 = 330 → costo unitario 110
        assertThat(result.getTotalCostAmount()).isEqualByComparingTo("330.00");
        assertThat(item.getUnitCost()).isEqualByComparingTo("110.00");
        assertThat(result.getStatus()).isEqualTo(Order.OrderStatus.PAID);

        ArgumentCaptor<OrderItemBatchAllocation> allocations = ArgumentCaptor.forClass(OrderItemBatchAllocation.class);
        verify(allocationRepository, times(2)).save(allocations.capture());
        assertThat(allocations.getAllValues())
                .extracting(OrderItemBatchAllocation::getQuantityAllocated)
                .containsExactly(2, 1);
    }

    @Test
    void confirmOrder_doesNotTouchLaterBatchesOnceFulfilled() {
        OrderItem item = item(2, "M");
        InventoryBatch first = batch(1L, "M", 5, "100.00");
        InventoryBatch second = batch(2L, "M", 5, "100.00");
        when(orderItemRepository.findByOrderId(1L)).thenReturn(List.of(item));
        when(inventoryBatchRepository.findAvailableBatchesForProductAndSize(10L, "M"))
                .thenReturn(List.of(first, second));

        orderService.confirmOrder("PED-123");

        assertThat(first.getQuantityRemaining()).isEqualTo(3);
        assertThat(second.getQuantityRemaining()).isEqualTo(5);
        verify(inventoryBatchRepository, never()).save(second);
    }

    @Test
    void confirmOrder_throwsWhenSizeHasInsufficientStock() {
        OrderItem item = item(4, "XL");
        when(orderItemRepository.findByOrderId(1L)).thenReturn(List.of(item));
        when(inventoryBatchRepository.findAvailableBatchesForProductAndSize(10L, "XL"))
                .thenReturn(List.of(batch(1L, "XL", 3, "100.00")));

        assertThatThrownBy(() -> orderService.confirmOrder("PED-123"))
                .isInstanceOf(InsufficientStockException.class)
                .hasMessageContaining("PARRILLA-01");

        assertThat(order.getStatus()).isEqualTo(Order.OrderStatus.PENDING);
        verifyNoInteractions(emailService, metaConversionsService);
    }

    @Test
    void confirmOrder_isIdempotentForAlreadyPaidOrders() {
        order.setStatus(Order.OrderStatus.PAID);

        Order result = orderService.confirmOrder("PED-123");

        assertThat(result).isSameAs(order);
        verifyNoInteractions(inventoryBatchRepository, allocationRepository, emailService, metaConversionsService);
    }

    @Test
    void deleteOrder_restoresAllocatedStockToOriginalBatches() {
        OrderItem item = item(3, "L");
        item.setId(50L);
        InventoryBatch batchA = batch(1L, "L", 0, "100.00");
        InventoryBatch batchB = batch(2L, "L", 4, "130.00");
        when(orderItemRepository.findByOrderId(1L)).thenReturn(List.of(item));
        when(allocationRepository.findByOrderItemId(50L))
                .thenReturn(List.of(allocation(item, batchA, 2), allocation(item, batchB, 1)));

        orderService.deleteOrder("PED-123");

        assertThat(batchA.getQuantityRemaining()).isEqualTo(2);
        assertThat(batchB.getQuantityRemaining()).isEqualTo(5);
        verify(orderRepository).delete(order);
    }

    @Test
    void cancelOrder_rejectsNonPendingOrders() {
        order.setStatus(Order.OrderStatus.PAID);

        assertThatThrownBy(() -> orderService.cancelOrder("PED-123"))
                .isInstanceOf(IllegalStateException.class);
    }

    private OrderItem item(int quantity, String size) {
        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setProduct(product);
        item.setQuantity(quantity);
        item.setSize(size);
        item.setUnitPrice(product.getSalePrice());
        return item;
    }

    private InventoryBatch batch(Long id, String size, int remaining, String unitCost) {
        InventoryBatch batch = new InventoryBatch();
        batch.setId(id);
        batch.setProduct(product);
        batch.setSize(size);
        batch.setQuantityProduced(Math.max(remaining, 1));
        batch.setQuantityRemaining(remaining);
        batch.setUnitCost(new BigDecimal(unitCost));
        return batch;
    }

    private OrderItemBatchAllocation allocation(OrderItem item, InventoryBatch batch, int quantity) {
        OrderItemBatchAllocation allocation = new OrderItemBatchAllocation();
        allocation.setOrderItem(item);
        allocation.setInventoryBatch(batch);
        allocation.setQuantityAllocated(quantity);
        allocation.setCostAtAllocation(batch.getUnitCost().multiply(BigDecimal.valueOf(quantity)));
        return allocation;
    }
}
