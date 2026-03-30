package com.fabrica.ecommerce.service;

import com.fabrica.ecommerce.dto.inventory.InventoryBatchRequestDTO;
import com.fabrica.ecommerce.model.InventoryBatch;
import com.fabrica.ecommerce.model.Product;
import com.fabrica.ecommerce.repository.InventoryBatchRepository;
import com.fabrica.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryBatchRepository inventoryBatchRepository;
    private final ProductRepository productRepository;

    @Transactional
    public InventoryBatch registerBatch(InventoryBatchRequestDTO request) {
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado"));

        BigDecimal unitCost = request.totalBatchCost()
                .divide(BigDecimal.valueOf(request.quantityProduced()), 2, RoundingMode.HALF_UP);

        InventoryBatch batch = new InventoryBatch();
        batch.setProduct(product);
        batch.setQuantityProduced(request.quantityProduced());
        batch.setQuantityRemaining(request.quantityProduced());
        batch.setUnitCost(unitCost);

        return inventoryBatchRepository.save(batch);
    }
}