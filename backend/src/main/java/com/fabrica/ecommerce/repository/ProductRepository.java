package com.fabrica.ecommerce.repository;

import com.fabrica.ecommerce.model.Product;
import com.fabrica.ecommerce.dto.product.ProductResponseDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByIsActiveTrue();
    Optional<Product> findBySku(String sku);

    @Query("SELECT new com.fabrica.ecommerce.dto.product.ProductResponseDTO(" +
           "p.id, p.sku, p.name, p.salePrice, c.name, COALESCE(SUM(ib.quantityRemaining), 0L)) " +
           "FROM Product p " +
           "JOIN p.category c " +
           "LEFT JOIN InventoryBatch ib ON ib.product.id = p.id " +
           "WHERE p.isActive = true " +
           "GROUP BY p.id, p.sku, p.name, p.salePrice, c.name")
    List<ProductResponseDTO> getActiveCatalogWithStock();
}