package com.fabrica.ecommerce.controller;

import com.fabrica.ecommerce.dto.order.OrderRequestDTO;
import com.fabrica.ecommerce.model.Order;
import com.fabrica.ecommerce.service.OrderService;
import com.fabrica.ecommerce.service.PdfService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final PdfService pdfService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrder(@Valid @RequestBody OrderRequestDTO request) {
        Map<String, Object> response = orderService.createPendingOrderWithMP(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/{orderCode}/confirm")
    public ResponseEntity<Order> confirmOrder(@PathVariable String orderCode) {
        Order confirmedOrder = orderService.confirmOrder(orderCode);
        return ResponseEntity.ok(confirmedOrder);
    }

    @PostMapping("/{orderCode}/ship")
    public ResponseEntity<Order> shipOrder(@PathVariable String orderCode) {
        Order shippedOrder = orderService.shipOrder(orderCode);
        return ResponseEntity.ok(shippedOrder);
    }

    @PostMapping("/{orderCode}/cancel")
    public ResponseEntity<Order> cancelOrder(@PathVariable String orderCode) {
        Order cancelledOrder = orderService.cancelOrder(orderCode);
        return ResponseEntity.ok(cancelledOrder);
    }

    @DeleteMapping("/{orderCode}")
    public ResponseEntity<Void> deleteOrder(@PathVariable String orderCode) {
        orderService.deleteOrder(orderCode);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{orderCode}")
    public ResponseEntity<com.fabrica.ecommerce.dto.order.OrderDetailResponseDTO> getOrderDetails(@PathVariable String orderCode) {
        return ResponseEntity.ok(orderService.getOrderDetails(orderCode));
    }

    @GetMapping("/{orderCode}/pdf")
    public ResponseEntity<byte[]> getOrderPdf(@PathVariable String orderCode) {
        com.fabrica.ecommerce.dto.order.OrderDetailResponseDTO orderDetails = orderService.getOrderDetails(orderCode);
        byte[] pdfBytes = pdfService.generateOrderReceipt(orderDetails);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", "remito_" + orderCode + ".pdf"); 

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> mercadoPagoWebhook(@RequestBody Map<String, Object> payload) {
        orderService.processWebHook(payload);
        return ResponseEntity.ok("OK");
    }
}