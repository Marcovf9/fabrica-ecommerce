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
    private final ShippingService shippingService;

    @Value("${spring.mail.username:ritualparrillas@gmail.com}")
    private String adminEmail;

    private String extractEmail(String customerContact) {
        try {
            return customerContact.split("\\|")[1].trim();
        } catch (Exception e) {
            return null;
        }
    }

    private String buildProfessionalEmail(String title, String mainContent, String trackingCode) {
        String trackingButton = trackingCode != null ? 
            "<div style='text-align: center; margin-top: 30px;'>" +
            "  <a href='https://ritualespacios.com/tracking?code=" + trackingCode + "' style='background-color: #D67026; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block; text-transform: uppercase; letter-spacing: 1px;'>Rastrear mi pedido</a>" +
            "</div>" : "";

        return "<div style=\"font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #3A322D; border-radius: 8px; overflow: hidden; background-color: #F5EFE6;\">" +
               "  <div style=\"background-color: #1A1816; padding: 30px; text-align: center; border-bottom: 3px solid #D67026;\">" +
               "    <img src=\"https://res.cloudinary.com/dq5bau3ky/image/upload/v1775488424/logo_hxkmk9.jpg\" alt=\"Ritual Espacios\" style=\"height: 70px; border-radius: 4px;\" />" +
               "  </div>" +
               "  <div style=\"padding: 40px 30px; color: #1A1816; line-height: 1.6;\">" +
               "    <h2 style=\"color: #D67026; margin-top: 0; text-transform: uppercase; letter-spacing: 1px; font-size: 22px;\">" + title + "</h2>" +
               mainContent +
               trackingButton +
               "  </div>" +
               "  <div style=\"background-color: #2B2522; padding: 30px; text-align: center; border-top: 1px solid #51433A; font-size: 12px; color: #B8B0A3;\">" +
               "    <p style=\"margin: 0 0 10px 0; font-weight: bold; color: #F5EFE6; letter-spacing: 2px;\">RITUAL ESPACIOS - FUEGO & DISEÑO</p>" +
               "    <p style=\"margin: 0 0 15px 0;\">Córdoba, Argentina</p>" +
               "    <p style=\"margin: 0;\">" +
               "      <a href=\"https://wa.me/5493517150510\" style=\"color: #D67026; text-decoration: none; font-weight: bold;\">WhatsApp</a> &nbsp;|&nbsp; " +
               "      <a href=\"https://instagram.com/ritual.espacios\" style=\"color: #D67026; text-decoration: none; font-weight: bold;\">Instagram</a> &nbsp;|&nbsp; " +
               "      <a href=\"mailto:ritualparrillas@gmail.com\" style=\"color: #D67026; text-decoration: none; font-weight: bold;\">Correo</a>" +
               "    </p>" +
               "  </div>" +
               "</div>";
    }

    @Transactional
    public Order createPendingOrder(OrderRequestDTO request) {
        Order order = new Order();
        order.setCustomerContact(request.customerContact());
        order.setDeliveryAddress(request.deliveryAddress());
        order.setStatus(Order.OrderStatus.PENDING);
        order.setOrderCode("PED-" + System.currentTimeMillis() % 1000000); 
        
        order.setTotalSaleAmount(BigDecimal.ZERO);
        order = orderRepository.save(order);

        int totalItems = request.items().stream().mapToInt(OrderItemRequestDTO::quantity).sum();
        String zip = "0000";
        try {
            zip = request.deliveryAddress().split("CP: ")[1].split(",")[0].trim();
        } catch (Exception e) { System.err.println("No se pudo extraer CP"); }

        BigDecimal shippingCost = shippingService.calculateShipping(zip, totalItems);
        BigDecimal totalSale = shippingCost;

        for (OrderItemRequestDTO itemDto : request.items()) {
            Product product = productRepository.findById(itemDto.productId())
                    .orElseThrow(() -> new IllegalArgumentException("Producto inválido"));

            if (!product.getIsActive()) throw new IllegalStateException("El producto no está activo.");

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(itemDto.quantity());
            orderItem.setUnitPrice(product.getSalePrice()); 
            
            // ASIGNACIÓN DE LA MEDIDA AL ÍTEM
            orderItem.setSize(itemDto.size()); 
            
            orderItemRepository.save(orderItem);

            BigDecimal itemTotal = product.getSalePrice().multiply(BigDecimal.valueOf(itemDto.quantity()));
            totalSale = totalSale.add(itemTotal);
        }

        order.setTotalSaleAmount(totalSale);
        Order savedOrder = orderRepository.save(order);

        String email = extractEmail(savedOrder.getCustomerContact());
        if (email != null) {
            String content = "<p style='font-size: 16px;'>Hemos registrado tu solicitud de compra por un total de <b>$" + totalSale + "</b> (Costo de envío estimado incluido).</p>" +
                             "<p style='font-size: 16px;'>El stock de tu pedido ha sido bloqueado temporalmente a tu nombre en nuestra planta.</p>" +
                             "<div style='background-color: #F8D7DA; color: #721C24; padding: 15px; border-left: 4px solid #D67026; margin: 25px 0; font-size: 14px;'>" +
                             "<strong>⚠️ Importante:</strong> El pedido no será procesado ni despachado hasta que te comuniques por nuestro canal de WhatsApp para coordinar y validar el pago correspondiente." +
                             "</div>" +
                             "<p style='font-size: 16px;'>Utiliza el botón inferior para conocer el estado de la operación.</p>";
            
            emailService.sendHtmlEmail(email, "Pedido Registrado #" + savedOrder.getOrderCode() + " - Ritual Espacios", buildProfessionalEmail("Confirmación de Pedido", content, savedOrder.getOrderCode()));
        }

        String adminHtmlBody = "<div style='font-family: Arial, sans-serif; color: #333;'>" +
            "<h2 style='color: #D67026;'>🚨 NUEVO PEDIDO PENDIENTE: #" + savedOrder.getOrderCode() + "</h2>" +
            "<p><strong>Total a cobrar:</strong> $" + totalSale + "</p>" +
            "<p><strong>Cliente / Contacto:</strong> " + savedOrder.getCustomerContact() + "</p>" +
            "<p><strong>Dirección de Envío:</strong> " + savedOrder.getDeliveryAddress() + "</p>" +
            "<hr style='border: 1px solid #ccc;'/>" +
            "<p><em>Ingresa al panel de administración para ver el detalle. Es tu responsabilidad contactar al cliente si no recibes el mensaje de WhatsApp.</em></p>" +
            "</div>";
        emailService.sendHtmlEmail(adminEmail, "VENTA PENDIENTE: #" + savedOrder.getOrderCode(), adminHtmlBody);

        return savedOrder;
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

        for (OrderItem item : items) {
            int quantityToFulfill = item.getQuantity();
            BigDecimal itemTotalCost = BigDecimal.ZERO;

            List<InventoryBatch> availableBatches = inventoryBatchRepository
            .findAvailableBatchesForProductAndSize(item.getProduct().getId(), item.getSize());

            for (InventoryBatch batch : availableBatches) {
                if (quantityToFulfill == 0) break;

                int availableInBatch = batch.getQuantityRemaining();
                int quantityToTake = Math.min(quantityToFulfill, availableInBatch);

                batch.setQuantityRemaining(availableInBatch - quantityToTake);
                inventoryBatchRepository.save(batch); 

                BigDecimal costOfThisFraction = batch.getUnitCost().multiply(BigDecimal.valueOf(quantityToTake));
                itemTotalCost = itemTotalCost.add(costOfThisFraction);

                OrderItemBatchAllocation allocation = new OrderItemBatchAllocation();
                allocation.setOrderItem(item);
                allocation.setInventoryBatch(batch);
                allocation.setQuantityAllocated(quantityToTake);
                allocation.setCostAtAllocation(costOfThisFraction);
                allocationRepository.save(allocation);

                quantityToFulfill -= quantityToTake;
            }

            if (quantityToFulfill > 0) {
                throw new InsufficientStockException("Stock físico insuficiente para el SKU: " + item.getProduct().getSku());
            }

            BigDecimal unitCost = itemTotalCost.divide(BigDecimal.valueOf(item.getQuantity()), 2, RoundingMode.HALF_UP);
            item.setUnitCost(unitCost);
            orderItemRepository.save(item);
            totalOrderCost = totalOrderCost.add(itemTotalCost);

            long remainingPhysicalStock = inventoryBatchRepository
                    .findAvailableBatchesForProduct(item.getProduct().getId())
                    .stream().mapToLong(InventoryBatch::getQuantityRemaining).sum();

            if (remainingPhysicalStock < 5) {
                emailService.sendHtmlEmail(adminEmail, "⚠️ URGENTE: Stock Crítico - SKU: " + item.getProduct().getSku(),
                    "<h2 style='color: #e74c3c;'>Alerta de Producción</h2>" +
                    "<p>El producto <b>" + item.getProduct().getName() + "</b> ha perforado el umbral mínimo de seguridad.</p>" +
                    "<p>Stock restante: <b>" + remainingPhysicalStock + " unidades.</b></p>");
            }
        }

        order.setTotalCostAmount(totalOrderCost);
        order.setStatus(Order.OrderStatus.PAID);
        Order savedOrder = orderRepository.save(order);

        String email = extractEmail(savedOrder.getCustomerContact());
        if (email != null) {
            String content = "<p style='font-size: 16px;'>Hemos validado tu pago exitosamente. La compra está asegurada.</p>" +
                             "<p style='font-size: 16px;'>Tu pedido ha sido remitido al sector operativo del galpón para iniciar su empaquetado y preparación logística. Recibirás una notificación cuando las estructuras estén en tránsito.</p>";
            emailService.sendHtmlEmail(email, "Pago Acreditado #" + savedOrder.getOrderCode() + " - Ritual Espacios", buildProfessionalEmail("Pago Confirmado", content, savedOrder.getOrderCode()));
        }

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
                        item.getSize() // <-- Tamaño expuesto hacia el frontend
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
}