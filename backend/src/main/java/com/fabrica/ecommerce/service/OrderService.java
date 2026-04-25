package com.fabrica.ecommerce.service;

import com.fabrica.ecommerce.exception.InsufficientStockException;
import com.fabrica.ecommerce.model.*;
import com.fabrica.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fabrica.ecommerce.dto.order.OrderRequestDTO;
import com.fabrica.ecommerce.dto.order.OrderItemRequestDTO;
import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.preference.*;
import java.util.Map;
import java.util.HashMap;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.resources.payment.Payment;

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
    private final EmailService emailService;

    @Value("${backend.url:https://ritual-backend-1bfi.onrender.com}")
    private String backendUrl;

    @Value("${spring.mail.username:ritualparrillas@gmail.com}")
    private String adminEmail;

    @Value("${mercadopago.access.token}")
    private String mpAccessToken;

    private String extractEmail(String customerContact) {
        try { return customerContact.split("\\|")[1].trim(); } catch (Exception e) { return null; }
    }

    private String buildProfessionalEmail(String title, String mainContent, String trackingCode) {
        String trackingButton = trackingCode != null ? 
            "<div style='text-align: center; margin-top: 30px;'><a href='https://ritualespacios.com/tracking?code=" + trackingCode + "' style='background-color: #D67026; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block; text-transform: uppercase; letter-spacing: 1px;'>Rastrear mi pedido</a></div>" : "";

        return "<div style=\"font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #3A322D; border-radius: 8px; overflow: hidden; background-color: #F5EFE6;\">" +
               "  <div style=\"background-color: #1A1816; padding: 30px; text-align: center; border-bottom: 3px solid #D67026;\">" +
               "    <img src=\"https://res.cloudinary.com/dq5bau3ky/image/upload/v1775488424/logo_hxkmk9.jpg\" alt=\"Ritual Espacios\" style=\"height: 70px; border-radius: 4px;\" />" +
               "  </div>" +
               "  <div style=\"padding: 40px 30px; color: #1A1816; line-height: 1.6;\">" +
               "    <h2 style=\"color: #D67026; margin-top: 0; text-transform: uppercase; letter-spacing: 1px; font-size: 22px;\">" + title + "</h2>" +
               mainContent + trackingButton +
               "  </div>" +
               "  <div style=\"background-color: #2B2522; padding: 30px; text-align: center; border-top: 1px solid #51433A; font-size: 12px; color: #B8B0A3;\">" +
               "    <p style=\"margin: 0 0 10px 0; font-weight: bold; color: #F5EFE6; letter-spacing: 2px;\">RITUAL ESPACIOS - FUEGO & DISEÑO</p>" +
               "  </div>" +
               "</div>";
    }

    @Transactional
    public Map<String, Object> createPendingOrderWithMP(OrderRequestDTO request) {
        Order order = new Order();
        order.setCustomerContact(request.customerContact());
        order.setDeliveryAddress(request.deliveryAddress());
        order.setStatus(Order.OrderStatus.PENDING);
        order.setOrderCode("PED-" + System.currentTimeMillis() % 1000000); 
        order.setTotalSaleAmount(BigDecimal.ZERO);
        order = orderRepository.save(order);

        BigDecimal subTotalProducts = BigDecimal.ZERO;

        for (OrderItemRequestDTO itemDto : request.items()) {
            Product product = productRepository.findById(itemDto.productId()).orElseThrow(() -> new IllegalArgumentException("Producto inválido"));
            if (!product.getIsActive()) throw new IllegalStateException("Producto inactivo.");

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(itemDto.quantity());
            orderItem.setUnitPrice(product.getSalePrice()); 
            orderItem.setSize(itemDto.size()); 
            orderItemRepository.save(orderItem);

            subTotalProducts = subTotalProducts.add(product.getSalePrice().multiply(BigDecimal.valueOf(itemDto.quantity())));
        }

        if ("TRANSFER".equalsIgnoreCase(request.paymentMethod())) {
            subTotalProducts = subTotalProducts.multiply(new BigDecimal("0.85"));
        }

        BigDecimal finalTotalSale = subTotalProducts;
        order.setTotalSaleAmount(finalTotalSale);
        Order savedOrder = orderRepository.save(order);

        String checkoutUrl = null;

        if ("MERCADO_PAGO".equalsIgnoreCase(request.paymentMethod())) {
            try {
                MercadoPagoConfig.setAccessToken(mpAccessToken);
                PreferenceItemRequest itemRequest = PreferenceItemRequest.builder().title("Pedido Ritual Espacios #" + savedOrder.getOrderCode()).quantity(1).unitPrice(finalTotalSale).currencyId("ARS").build();

                PreferenceRequest preferenceRequest = PreferenceRequest.builder()
                    .items(List.of(itemRequest))
                    .backUrls(PreferenceBackUrlsRequest.builder()
                    .success("https://ritualespacios.com/pago-exitoso")
                    .failure("https://ritualespacios.com/pago-fallido")
                    .pending("https://ritualespacios.com/pago-pendiente")
                    .build())
                    .autoReturn("approved")
                    .externalReference(savedOrder.getOrderCode())
                    .notificationUrl(backendUrl + "/api/orders/webhook") 
                    .build();

                PreferenceClient client = new PreferenceClient();
                checkoutUrl = client.create(preferenceRequest).getInitPoint();
                
            } catch (Exception e) { throw new RuntimeException("Error MP: " + e.getMessage()); }
        } else {
            String email = extractEmail(savedOrder.getCustomerContact());
            if (email != null) {
                emailService.sendHtmlEmail(email, "Pedido Pendiente #" + savedOrder.getOrderCode(), buildProfessionalEmail("Confirmación de Pedido", "<p>Hemos registrado tu compra por <b>$" + finalTotalSale + "</b>.</p><p>Recuerda escribirnos por WhatsApp para procesar tu transferencia con descuento.</p>", savedOrder.getOrderCode()));
            }
            emailService.sendHtmlEmail(adminEmail, "⚠️ NUEVO PEDIDO - Transferencia #" + savedOrder.getOrderCode(), buildProfessionalEmail("Nueva Venta (Esperando Transferencia)", "<p>El cliente <b>" + savedOrder.getCustomerContact() + "</b> armó un pedido.</p><p>Monto a transferir: <b>$" + finalTotalSale + "</b>.</p>", null));
        }

        Map<String, Object> responseMap = new HashMap<>();
        responseMap.put("order", savedOrder);
        responseMap.put("checkoutUrl", checkoutUrl);
        return responseMap;
    }

    @Transactional
    public Order confirmOrder(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode).orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + orderCode));
        if (order.getStatus() != Order.OrderStatus.PENDING) return order;

        BigDecimal totalOrderCost = BigDecimal.ZERO;
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());

        for (OrderItem item : items) {
            int quantityToFulfill = item.getQuantity();
            BigDecimal itemTotalCost = BigDecimal.ZERO;

            List<InventoryBatch> availableBatches = inventoryBatchRepository.findAvailableBatchesForProductAndSize(item.getProduct().getId(), item.getSize());

            for (InventoryBatch batch : availableBatches) {
                if (quantityToFulfill == 0) break;
                int quantityToTake = Math.min(quantityToFulfill, batch.getQuantityRemaining());
                batch.setQuantityRemaining(batch.getQuantityRemaining() - quantityToTake);
                inventoryBatchRepository.save(batch); 

                BigDecimal costOfThisFraction = batch.getUnitCost().multiply(BigDecimal.valueOf(quantityToTake));
                itemTotalCost = itemTotalCost.add(costOfThisFraction);

                OrderItemBatchAllocation allocation = new OrderItemBatchAllocation();
                allocation.setOrderItem(item); allocation.setInventoryBatch(batch); allocation.setQuantityAllocated(quantityToTake); allocation.setCostAtAllocation(costOfThisFraction);
                allocationRepository.save(allocation);

                quantityToFulfill -= quantityToTake;
            }

            if (quantityToFulfill > 0) throw new InsufficientStockException("Stock físico insuficiente para: " + item.getProduct().getSku());

            item.setUnitCost(itemTotalCost.divide(BigDecimal.valueOf(item.getQuantity()), 2, RoundingMode.HALF_UP));
            orderItemRepository.save(item);
            totalOrderCost = totalOrderCost.add(itemTotalCost);
        }

        order.setTotalCostAmount(totalOrderCost);
        order.setStatus(Order.OrderStatus.PAID);
        Order savedOrder = orderRepository.save(order);

        String email = extractEmail(savedOrder.getCustomerContact());
        if (email != null) {
            emailService.sendHtmlEmail(email, "Pago Acreditado #" + savedOrder.getOrderCode() + " - Ritual Espacios", buildProfessionalEmail("Pago Confirmado", "<p>Hemos validado tu pago exitosamente. La compra está asegurada.</p><p>Tu pedido ha sido remitido al sector operativo. Recibirás una notificación cuando las estructuras estén en tránsito.</p>", savedOrder.getOrderCode()));
        }
        
        emailService.sendHtmlEmail(adminEmail, "💰 PAGO APROBADO - #" + savedOrder.getOrderCode(), buildProfessionalEmail("¡Venta Pagada!", "<p>Ingresó un pago por <b>$" + savedOrder.getTotalSaleAmount() + "</b> del cliente " + savedOrder.getCustomerContact() + ".</p><p>Ingresa al panel para gestionar el despacho.</p>", null));

        return savedOrder;
    }
    
    @Transactional
    public Order shipOrder(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + orderCode));

        if (order.getStatus() != Order.OrderStatus.PAID) {
            throw new IllegalStateException("El pedido debe estar PAGADO antes de ser enviado.");
        }

        order.setStatus(Order.OrderStatus.SHIPPED);
        Order savedOrder = orderRepository.save(order);

        String email = extractEmail(savedOrder.getCustomerContact());
        if (email != null) {
            String content = "<p style='font-size: 16px;'>¡Tus estructuras están en camino!</p>" +
                             "<p style='font-size: 16px;'>El pedido ha salido de las instalaciones de nuestra fábrica. Según lo acordado, el transporte logístico gestionará la entrega en la dirección especificada.</p>" +
                             "<p style='font-size: 16px; margin-top: 20px;'>Gracias por confiar en la solidez de nuestra fundición.</p>";
            emailService.sendHtmlEmail(email, "Pedido Despachado #" + savedOrder.getOrderCode() + " - Ritual Espacios", buildProfessionalEmail("En Tránsito Logístico", content, savedOrder.getOrderCode()));
        }

        return savedOrder;
    }

    @Transactional
    public Order cancelOrder(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + orderCode));

        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new IllegalStateException("Solo se pueden cancelar pedidos en estado PENDING.");
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        Order savedOrder = orderRepository.save(order);

        String email = extractEmail(savedOrder.getCustomerContact());
        if (email != null) {
            String content = "<p style='font-size: 16px;'>Te informamos que tu pedido ha sido cancelado en nuestro sistema administrativo.</p>" +
                             "<p style='font-size: 16px;'>El stock de la mercancía que habías reservado ha sido liberado de nuevo a la planta de producción.</p>" +
                             "<p style='font-size: 16px;'>Si esto se trata de un error operativo, por favor comunícate a la brevedad respondiendo a este correo o mediante nuestro canal oficial de atención.</p>";
            emailService.sendHtmlEmail(email, "Cancelación de Pedido #" + savedOrder.getOrderCode() + " - Ritual Espacios", buildProfessionalEmail("Operación Anulada", content, null));
        }

        return savedOrder;
    }

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Transactional(readOnly = true)
    public com.fabrica.ecommerce.dto.order.OrderDetailResponseDTO getOrderDetails(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado"));
        
        List<com.fabrica.ecommerce.dto.order.OrderItemDetailDTO> items = orderItemRepository.findByOrderId(order.getId()).stream()
                .map(item -> new com.fabrica.ecommerce.dto.order.OrderItemDetailDTO(
                        item.getProduct().getName(),
                        item.getProduct().getSku(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())),
                        item.getSize()
                )).toList();
        
        return new com.fabrica.ecommerce.dto.order.OrderDetailResponseDTO(
                order.getOrderCode(), 
                order.getCustomerContact(), 
                order.getDeliveryAddress(),
                order.getStatus().name(), 
                order.getTotalSaleAmount(), 
                items
        );
    }

    @Transactional
    public void deleteOrder(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode).orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + orderCode));
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        orderItemRepository.deleteAll(items);
        orderRepository.delete(order);
    }

    @Transactional
    public void processWebHook(Map<String, Object> payload) {
        try {
            String type = (String) payload.get("type");
            if (type == null) type = (String) payload.get("action");

            if ("payment".equals(type) || "payment.created".equals(type) || "payment.updated".equals(type)) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) payload.get("data");
                Long paymentId = Long.valueOf(String.valueOf(data.get("id")));

                MercadoPagoConfig.setAccessToken(mpAccessToken);
                Payment payment = new PaymentClient().get(paymentId);

                if ("approved".equals(payment.getStatus())) {
                    String orderCode = payment.getExternalReference();
                    if (orderCode != null) {
                        Order order = orderRepository.findByOrderCode(orderCode).orElse(null);
                        if (order != null && order.getStatus() == Order.OrderStatus.PENDING) {
                            confirmOrder(orderCode); // Esto ahora enviará correos automáticamente
                        }
                    }
                }
            }
        } catch (Exception e) { System.err.println("Error procesando Webhook de MP: " + e.getMessage()); }
    }
}