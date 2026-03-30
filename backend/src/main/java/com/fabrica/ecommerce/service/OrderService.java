package com.fabrica.ecommerce.service;

import com.fabrica.ecommerce.exception.InsufficientStockException;
import com.fabrica.ecommerce.model.*;
import com.fabrica.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fabrica.ecommerce.dto.order.OrderRequestDTO;
import com.fabrica.ecommerce.dto.order.OrderItemRequestDTO;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final OrderItemBatchAllocationRepository allocationRepository;
    private final ProductRepository productRepository;

@Transactional
public Order createPendingOrder(OrderRequestDTO request) {
    Order order = new Order();
    order.setCustomerContact(request.customerContact());
    order.setStatus(Order.OrderStatus.PENDING);
    // Generar un código único corto (Ej: PED-170364)
    order.setOrderCode("PED-" + System.currentTimeMillis() % 1000000); 
    
    BigDecimal totalSale = BigDecimal.ZERO;
    order = orderRepository.save(order);

    for (OrderItemRequestDTO itemDto : request.items()) {
        Product product = productRepository.findById(itemDto.productId())
                .orElseThrow(() -> new IllegalArgumentException("Producto inválido: " + itemDto.productId()));

        if (!product.getIsActive()) {
            throw new IllegalStateException("El producto " + product.getSku() + " no está activo.");
        }

        OrderItem orderItem = new OrderItem();
        orderItem.setOrder(order);
        orderItem.setProduct(product);
        orderItem.setQuantity(itemDto.quantity());
        orderItem.setUnitPrice(product.getSalePrice()); // El precio se saca de la BD, NO del frontend

        orderItemRepository.save(orderItem);

        BigDecimal itemTotal = product.getSalePrice().multiply(BigDecimal.valueOf(itemDto.quantity()));
        totalSale = totalSale.add(itemTotal);
    }

    order.setTotalSaleAmount(totalSale);
    return orderRepository.save(order);
}

    @Transactional
    public Order confirmOrder(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + orderCode));

        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new IllegalStateException("El pedido " + orderCode + " no está en estado PENDING.");
        }

        BigDecimal totalOrderCost = BigDecimal.ZERO;
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());

        // Procesar cada producto del carrito
        for (OrderItem item : items) {
            int quantityToFulfill = item.getQuantity();
            BigDecimal itemTotalCost = BigDecimal.ZERO;

            // Traer lotes de producción disponibles (FIFO estricto gracias a la query)
            List<InventoryBatch> availableBatches = inventoryBatchRepository
                    .findAvailableBatchesForProduct(item.getProduct().getId());

            // Loop de asignación fraccionada
            for (InventoryBatch batch : availableBatches) {
                if (quantityToFulfill == 0) break; // Ya cubrimos la demanda de este ítem

                int availableInBatch = batch.getQuantityRemaining();
                int quantityToTake = Math.min(quantityToFulfill, availableInBatch);

                // 1. Restar físicamente del lote
                batch.setQuantityRemaining(availableInBatch - quantityToTake);
                inventoryBatchRepository.save(batch); // Actualiza la DB

                // 2. Calcular el costo exacto de esta fracción
                BigDecimal costOfThisFraction = batch.getUnitCost().multiply(BigDecimal.valueOf(quantityToTake));
                itemTotalCost = itemTotalCost.add(costOfThisFraction);

                // 3. Crear el registro de auditoría en la tabla de resolución
                OrderItemBatchAllocation allocation = new OrderItemBatchAllocation();
                allocation.setOrderItem(item);
                allocation.setInventoryBatch(batch);
                allocation.setQuantityAllocated(quantityToTake);
                allocation.setCostAtAllocation(costOfThisFraction);
                allocationRepository.save(allocation);

                // 4. Reducir la demanda pendiente
                quantityToFulfill -= quantityToTake;
            }

            // Validación crítica: Si el loop terminó y aún falta cantidad, hay un quiebre de stock físico
            if (quantityToFulfill > 0) {
                throw new InsufficientStockException(
                        "Stock insuficiente para el producto SKU: " + item.getProduct().getSku() + 
                        ". Faltan " + quantityToFulfill + " unidades."
                );
            }

            // Consolidar el costo promedio en la línea del pedido
            BigDecimal unitCost = itemTotalCost.divide(BigDecimal.valueOf(item.getQuantity()), 2, RoundingMode.HALF_UP);
            item.setUnitCost(unitCost);
            orderItemRepository.save(item);

            // Sumar al total general de la orden
            totalOrderCost = totalOrderCost.add(itemTotalCost);
        }

        // Finalizar la orden
        order.setTotalCostAmount(totalOrderCost);
        order.setStatus(Order.OrderStatus.CONFIRMED);
        return orderRepository.save(order);
    }
}