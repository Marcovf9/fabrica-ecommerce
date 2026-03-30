package com.fabrica.ecommerce.controller;

import com.fabrica.ecommerce.dto.order.OrderRequestDTO;
import com.fabrica.ecommerce.model.Order;
import com.fabrica.ecommerce.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /**
     * Endpoint Público: Catálogo React
     * POST /api/orders
     */
    @PostMapping
    public ResponseEntity<Order> createOrder(@Valid @RequestBody OrderRequestDTO request) {
        Order pendingOrder = orderService.createPendingOrder(request);
        return new ResponseEntity<>(pendingOrder, HttpStatus.CREATED);
    }

    /**
     * Endpoint Privado: Backoffice de Vendedores
     * POST /api/orders/{orderCode}/confirm
     */
    @PostMapping("/{orderCode}/confirm")
    public ResponseEntity<Order> confirmOrder(@PathVariable String orderCode) {
        Order confirmedOrder = orderService.confirmOrder(orderCode);
        return ResponseEntity.ok(confirmedOrder);
    }
}