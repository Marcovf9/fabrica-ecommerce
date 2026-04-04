package com.fabrica.ecommerce.repository;

import com.fabrica.ecommerce.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByIsActiveTrue();
    Optional<Product> findBySku(String sku);

    @Query("SELECT p, " +
           "(COALESCE((SELECT SUM(ib.quantityRemaining) FROM InventoryBatch ib WHERE ib.product.id = p.id), 0L) - " +
           "COALESCE((SELECT SUM(oi.quantity) FROM OrderItem oi JOIN oi.order o WHERE oi.product.id = p.id AND o.status = 'PENDING'), 0L)) " +
           "FROM Product p " +
           "WHERE p.isActive = true")
    List<Object[]> getActiveProductsWithStock();
}