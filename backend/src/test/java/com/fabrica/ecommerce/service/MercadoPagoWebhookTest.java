package com.fabrica.ecommerce.service;

import com.fabrica.ecommerce.model.Order;
import com.fabrica.ecommerce.repository.*;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.resources.payment.Payment;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedConstruction;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Webhook (IPN) de Mercado Pago: solo un pago "approved" de un pedido PENDING
 * debe confirmar el pedido; cualquier otro caso se ignora sin lanzar excepciones.
 */
@ExtendWith(MockitoExtension.class)
class MercadoPagoWebhookTest {

    @Mock OrderRepository orderRepository;
    @Mock OrderItemRepository orderItemRepository;
    @Mock InventoryBatchRepository inventoryBatchRepository;
    @Mock MetaConversionsService metaConversionsService;
    @Mock OrderItemBatchAllocationRepository allocationRepository;
    @Mock ProductRepository productRepository;
    @Mock EmailService emailService;

    @InjectMocks OrderService orderService;

    private Order order;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(orderService, "mpAccessToken", "TEST-token");
        order = new Order();
        order.setId(1L);
        order.setOrderCode("PED-777");
        order.setStatus(Order.OrderStatus.PENDING);
        order.setTotalSaleAmount(new BigDecimal("5000.00"));
    }

    @Test
    void approvedPayment_confirmsPendingOrder() throws Exception {
        when(orderRepository.findByOrderCode("PED-777")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderItemRepository.findByOrderId(1L)).thenReturn(List.of());

        try (MockedConstruction<PaymentClient> mp = mockPayment("approved", "PED-777")) {
            orderService.processWebHook(paymentNotification("payment", 123L));

            verify(mp.constructed().get(0)).get(123L);
        }

        assertThat(order.getStatus()).isEqualTo(Order.OrderStatus.PAID);
        verify(metaConversionsService).sendPurchaseEvent(eq("PED-777"), any(), anyList());
    }

    @Test
    void actionFieldIsAcceptedWhenTypeIsMissing() {
        when(orderRepository.findByOrderCode("PED-777")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderItemRepository.findByOrderId(1L)).thenReturn(List.of());

        try (MockedConstruction<PaymentClient> ignored = mockPayment("approved", "PED-777")) {
            orderService.processWebHook(Map.of("action", "payment.updated", "data", Map.of("id", "123")));
        }

        assertThat(order.getStatus()).isEqualTo(Order.OrderStatus.PAID);
    }

    @Test
    void nonApprovedPayment_leavesOrderPending() {
        try (MockedConstruction<PaymentClient> ignored = mockPayment("rejected", "PED-777")) {
            orderService.processWebHook(paymentNotification("payment", 123L));
        }

        assertThat(order.getStatus()).isEqualTo(Order.OrderStatus.PENDING);
        verify(orderRepository, never()).save(any());
        verifyNoInteractions(inventoryBatchRepository, emailService);
    }

    @Test
    void duplicatedNotification_doesNotConfirmTwice() {
        order.setStatus(Order.OrderStatus.PAID);
        when(orderRepository.findByOrderCode("PED-777")).thenReturn(Optional.of(order));

        try (MockedConstruction<PaymentClient> ignored = mockPayment("approved", "PED-777")) {
            orderService.processWebHook(paymentNotification("payment", 123L));
        }

        verify(orderRepository, never()).save(any());
        verifyNoInteractions(inventoryBatchRepository, emailService, metaConversionsService);
    }

    @Test
    void unknownOrderReference_isIgnored() {
        when(orderRepository.findByOrderCode("PED-000")).thenReturn(Optional.empty());

        try (MockedConstruction<PaymentClient> ignored = mockPayment("approved", "PED-000")) {
            orderService.processWebHook(paymentNotification("payment", 123L));
        }

        verify(orderRepository, never()).save(any());
    }

    @Test
    void nonPaymentTopics_doNotQueryMercadoPago() {
        try (MockedConstruction<PaymentClient> mp = mockConstruction(PaymentClient.class)) {
            orderService.processWebHook(Map.of("type", "merchant_order", "data", Map.of("id", "1")));

            assertThat(mp.constructed()).isEmpty();
        }
        verifyNoInteractions(orderRepository);
    }

    @Test
    void malformedPayload_isSwallowedSoMercadoPagoGetsA200() {
        assertThatCode(() -> orderService.processWebHook(Map.of("type", "payment")))
                .doesNotThrowAnyException();
        verifyNoInteractions(orderRepository);
    }

    @Test
    void mercadoPagoApiFailure_isSwallowed() {
        try (MockedConstruction<PaymentClient> ignored = mockConstruction(PaymentClient.class,
                (client, ctx) -> when(client.get(anyLong())).thenThrow(new RuntimeException("timeout")))) {
            assertThatCode(() -> orderService.processWebHook(paymentNotification("payment", 123L)))
                    .doesNotThrowAnyException();
        }
        verifyNoInteractions(orderRepository);
    }

    private static Map<String, Object> paymentNotification(String type, Long paymentId) {
        return Map.of("type", type, "data", Map.of("id", String.valueOf(paymentId)));
    }

    private static MockedConstruction<PaymentClient> mockPayment(String status, String externalReference) {
        Payment payment = mock(Payment.class);
        when(payment.getStatus()).thenReturn(status);
        lenient().when(payment.getExternalReference()).thenReturn(externalReference);
        return mockConstruction(PaymentClient.class,
                (client, ctx) -> when(client.get(anyLong())).thenReturn(payment));
    }
}
