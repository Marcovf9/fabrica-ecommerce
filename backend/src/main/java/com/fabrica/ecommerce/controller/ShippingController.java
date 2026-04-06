package com.fabrica.ecommerce.controller;

import com.fabrica.ecommerce.service.ShippingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/shipping")
@RequiredArgsConstructor
@CrossOrigin("*") // <-- AUTORIZACIÓN DE ORIGEN CRUZADO
public class ShippingController {

    private final ShippingService shippingService;

    @GetMapping("/calculate")
    public ResponseEntity<BigDecimal> calculate(@RequestParam String zip, @RequestParam int totalItems) {
        return ResponseEntity.ok(shippingService.calculateShipping(zip, totalItems));
    }
}