package com.fabrica.ecommerce.repository;

import com.fabrica.ecommerce.model.InventoryBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, Long> {
    
    // Esta consulta es el motor de tu valuación de inventario.
    // Trae los lotes de un producto específico, que aún tienen unidades, 
    // ordenados del más viejo al más nuevo.
    @Query("SELECT ib FROM InventoryBatch ib WHERE ib.product.id = :productId AND ib.quantityRemaining > 0 ORDER BY ib.createdAt ASC")
    List<InventoryBatch> findAvailableBatchesForProduct(@Param("productId") Long productId);
}