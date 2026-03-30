package com.fabrica.ecommerce.controller;

import com.fabrica.ecommerce.dto.inventory.InventoryBatchRequestDTO;
import com.fabrica.ecommerce.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @PostMapping("/batches")
    public ResponseEntity<Void> addBatch(@Valid @RequestBody InventoryBatchRequestDTO request) {
        inventoryService.registerBatch(request);
        return ResponseEntity.ok().build();
    }
}