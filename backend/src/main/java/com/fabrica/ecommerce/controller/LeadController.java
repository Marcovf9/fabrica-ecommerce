package com.fabrica.ecommerce.controller;

import com.fabrica.ecommerce.dto.LeadRequestDTO;
import com.fabrica.ecommerce.model.AbandonedCart;
import com.fabrica.ecommerce.repository.AbandonedCartRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/leads")
@CrossOrigin(origins = "*")
public class LeadController {

    private final AbandonedCartRepository repository;

    public LeadController(AbandonedCartRepository repository) {
        this.repository = repository;
    }

    @PostMapping("/capture")
    public ResponseEntity<Void> captureLead(@RequestBody LeadRequestDTO request) {
        if ((request.email() == null || request.email().isBlank()) &&
            (request.phone() == null || request.phone().isBlank())) {
            return ResponseEntity.badRequest().build();
        }

        AbandonedCart cart = repository.findByCustomerEmailOrCustomerPhone(request.email(), request.phone())
                .orElse(new AbandonedCart());

        cart.setCustomerEmail(request.email());
        cart.setCustomerPhone(request.phone());
        cart.setCartContent(request.cartContent());
        cart.setRecovered(false);

        repository.save(cart);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<Iterable<AbandonedCart>> getAbandonedCarts() {
        return ResponseEntity.ok(repository.findByRecoveredFalse());
    }

    @PatchMapping("/{id}/recover")
    public ResponseEntity<Void> markAsRecovered(@PathVariable Long id) {
        return repository.findById(id).map(cart -> {
            cart.setRecovered(true);
            repository.save(cart);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAbandonedCart(@PathVariable Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}