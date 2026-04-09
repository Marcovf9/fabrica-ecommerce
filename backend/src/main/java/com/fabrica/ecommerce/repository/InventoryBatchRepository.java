package com.fabrica.ecommerce.repository;

import com.fabrica.ecommerce.model.InventoryBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, Long> {
    
    @Query("SELECT ib FROM InventoryBatch ib WHERE ib.product.id = :productId AND ib.quantityRemaining > 0 ORDER BY ib.createdAt ASC")
    List<InventoryBatch> findAvailableBatchesForProduct(@Param("productId") Long productId);

    @Query("SELECT ib FROM InventoryBatch ib WHERE ib.product.id = :productId AND ib.size = :size AND ib.quantityRemaining > 0 ORDER BY ib.createdAt ASC")
    List<InventoryBatch> findAvailableBatchesForProductAndSize(@Param("productId") Long productId, @Param("size") String size);
}