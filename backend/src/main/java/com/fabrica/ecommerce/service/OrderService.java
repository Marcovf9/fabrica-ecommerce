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
    private final EmailService emailService;

    private String extractEmail(String customerContact) {
        try {
            return customerContact.split("\\|")[1].trim();
        } catch (Exception e) {
            return null;
        }
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

        BigDecimal totalSale = BigDecimal.ZERO;

        for (OrderItemRequestDTO itemDto : request.items()) {
            Product product = productRepository.findById(itemDto.productId())
                    .orElseThrow(() -> new IllegalArgumentException("Producto inválido"));

            if (!product.getIsActive()) {
                throw new IllegalStateException("El producto no está activo.");
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(itemDto.quantity());
            orderItem.setUnitPrice(product.getSalePrice()); 

            orderItemRepository.save(orderItem);

            BigDecimal itemTotal = product.getSalePrice().multiply(BigDecimal.valueOf(itemDto.quantity()));
            totalSale = totalSale.add(itemTotal);
        }

        order.setTotalSaleAmount(totalSale);
        Order savedOrder = orderRepository.save(order);

        String email = extractEmail(savedOrder.getCustomerContact());
        if (email != null) {
            String trackingUrl = "http://localhost:5173/tracking?code=" + savedOrder.getOrderCode();

            emailService.sendHtmlEmail(email, "Pedido Registrado #" + savedOrder.getOrderCode(),
                "<div style='font-family: Arial, sans-serif; color: #333;'>" +
                "<h2 style='color: #2c3e50;'>¡Hola! Recibimos tu pedido " + savedOrder.getOrderCode() + "</h2>" +
                "<p>Hemos registrado tu solicitud exitosamente. Tu stock ha sido reservado.</p>" +
                "<p>Por favor contáctanos por WhatsApp para coordinar el pago por un total de <b>$" + totalSale + "</b>.</p>" +
                "<br/>" +
                "<div style='margin-top: 20px;'>" +
                "  <a href='" + trackingUrl + "' style='background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;'>" +
                "    Ver Seguimiento de mi Pedido" +
                "  </a>" +
                "</div>" +
                "<p style='font-size: 0.8rem; color: #7f8c8d; margin-top: 15px;'>También puedes ingresar manualmente el código <b>" + savedOrder.getOrderCode() + "</b> en nuestra web.</p>" +
                "</div>");
        }

        // ALERTA INTERNA PARA ADMINISTRACIÓN
        String adminHtmlBody = "<div style='font-family: Arial, sans-serif; color: #333;'>" +
            "<h2 style='color: #D67026;'>🚨 NUEVO PEDIDO PENDIENTE: #" + savedOrder.getOrderCode() + "</h2>" +
            "<p><strong>Total a cobrar:</strong> $" + totalSale + "</p>" +
            "<p><strong>Cliente / Contacto:</strong> " + savedOrder.getCustomerContact() + "</p>" +
            "<p><strong>Dirección de Envío:</strong> " + savedOrder.getDeliveryAddress() + "</p>" +
            "<hr style='border: 1px solid #ccc;'/>" +
            "<p><em>Ingresa al panel de administración para ver el detalle. Es tu responsabilidad contactar al cliente si no recibes el mensaje de WhatsApp.</em></p>" +
            "</div>";

        emailService.sendHtmlEmail("ritualparrillas@gmail.com", "VENTA PENDIENTE: #" + savedOrder.getOrderCode(), adminHtmlBody);

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
                    .findAvailableBatchesForProduct(item.getProduct().getId());

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
                throw new InsufficientStockException(
                        "Stock físico insuficiente para el SKU: " + item.getProduct().getSku() + 
                        ". Faltan " + quantityToFulfill + " unidades."
                );
            }

            BigDecimal unitCost = itemTotalCost.divide(BigDecimal.valueOf(item.getQuantity()), 2, RoundingMode.HALF_UP);
            item.setUnitCost(unitCost);
            orderItemRepository.save(item);

            totalOrderCost = totalOrderCost.add(itemTotalCost);

            // AUDITORÍA DE STOCK CRÍTICO
            long remainingPhysicalStock = inventoryBatchRepository
                    .findAvailableBatchesForProduct(item.getProduct().getId())
                    .stream()
                    .mapToLong(InventoryBatch::getQuantityRemaining)
                    .sum();

            if (remainingPhysicalStock < 5) {
                emailService.sendHtmlEmail("ritualparrillas@gmail.com", 
                    "⚠️ URGENTE: Stock Crítico - SKU: " + item.getProduct().getSku(),
                    "<h2 style='color: #e74c3c;'>Alerta de Producción</h2>" +
                    "<p>El producto <b>" + item.getProduct().getName() + "</b> (SKU: " + item.getProduct().getSku() + ") " +
                    "ha perforado el umbral mínimo de seguridad tras la orden " + order.getOrderCode() + ".</p>" +
                    "<p>Stock físico restante en galpón: <b>" + remainingPhysicalStock + " unidades.</b></p>" +
                    "<p>Se requiere activar la matriz correspondiente en el próximo turno de fundición.</p>");
            }
        }

        order.setTotalCostAmount(totalOrderCost);
        order.setStatus(Order.OrderStatus.PAID);
        Order savedOrder = orderRepository.save(order);

        /// DISPARO DE CORREO: Pago Confirmado
        String email = extractEmail(savedOrder.getCustomerContact());
        if (email != null) {
            String trackingUrl = "http://localhost:5173/tracking?code=" + savedOrder.getOrderCode();
            emailService.sendHtmlEmail(email, "Pago Confirmado #" + savedOrder.getOrderCode(),
                "<div style='font-family: Arial, sans-serif; color: #333;'>" +
                "<h2 style='color: #27ae60;'>¡Pago recibido!</h2>" +
                "<p>Hemos registrado el pago de tu pedido <b>" + savedOrder.getOrderCode() + "</b> de manera exitosa.</p>" +
                "<p>En breve procederemos a prepararlo para su despacho. Te notificaremos cuando esté en camino.</p>" +
                "<br/>" +
                "<div style='margin-top: 20px;'>" +
                "  <a href='" + trackingUrl + "' style='background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;'>" +
                "    Ver Seguimiento de mi Pedido" +
                "  </a>" +
                "</div>" +
                "</div>");
        }

        return savedOrder;
    }
    
    @Transactional
    public Order shipOrder(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + orderCode));

        if (order.getStatus() != Order.OrderStatus.PAID) {
            throw new IllegalStateException("El pedido debe estar PAGADO (PAID) antes de ser enviado.");
        }

        order.setStatus(Order.OrderStatus.SHIPPED);
        Order savedOrder = orderRepository.save(order);

        // DISPARO DE CORREO: Despachado
        String email = extractEmail(savedOrder.getCustomerContact());
        if (email != null) {
            String trackingUrl = "http://localhost:5173/tracking?code=" + savedOrder.getOrderCode();
            emailService.sendHtmlEmail(email, "Pedido Despachado #" + savedOrder.getOrderCode(),
                "<div style='font-family: Arial, sans-serif; color: #333;'>" +
                "<h2 style='color: #2980b9;'>Tu pedido está en camino 🚚</h2>" +
                "<p>El pedido <b>" + savedOrder.getOrderCode() + "</b> ha salido de nuestras instalaciones.</p>" +
                "<p>¡Gracias por confiar en nuestra fábrica!</p>" +
                "<br/>" +
                "<div style='margin-top: 20px;'>" +
                "  <a href='" + trackingUrl + "' style='background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;'>" +
                "    Ver Seguimiento de mi Pedido" +
                "  </a>" +
                "</div>" +
                "</div>");
        }

        return savedOrder;
    }

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
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

        // DISPARO DE CORREO: Cancelado
        String email = extractEmail(savedOrder.getCustomerContact());
        if (email != null) {
            emailService.sendHtmlEmail(email, "Pedido Cancelado #" + savedOrder.getOrderCode(),
                "<div style='font-family: Arial, sans-serif; color: #333;'>" +
                "<h2 style='color: #e74c3c;'>Pedido Cancelado</h2>" +
                "<p>Tu pedido <b>" + savedOrder.getOrderCode() + "</b> ha sido cancelado y tu stock reservado ha sido liberado.</p>" +
                "<p>Si crees que esto es un error, por favor comunícate con nosotros.</p>" +
                "</div>");
        }

        return savedOrder;
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
                        item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
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