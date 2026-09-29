package com.fabrica.ecommerce.repository;

import com.fabrica.ecommerce.model.Category;
import com.fabrica.ecommerce.model.InventoryBatch;
import com.fabrica.ecommerce.model.Product;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class InventoryBatchRepositoryTest {

    @Autowired TestEntityManager em;
    @Autowired InventoryBatchRepository repository;

    private Product product;
    private Product otherProduct;

    @BeforeEach
    void setUp() {
        Category category = new Category();
        category.setName("Parrillas");
        category.setType(Category.CategoryType.HIERRO);
        em.persist(category);
        product = persistProduct(category, "SKU-1");
        otherProduct = persistProduct(category, "SKU-2");
    }

    @Test
    void findsOnlyBatchesWithStockForTheRequestedSizeOldestFirst() {
        InventoryBatch newest = persistBatch(product, "L", 3, LocalDateTime.now());
        InventoryBatch oldest = persistBatch(product, "L", 2, LocalDateTime.now().minusDays(10));
        persistBatch(product, "L", 0, LocalDateTime.now().minusDays(20));   // agotado
        persistBatch(product, "M", 9, LocalDateTime.now().minusDays(30));   // otro talle
        persistBatch(otherProduct, "L", 9, LocalDateTime.now().minusDays(30)); // otro producto

        List<InventoryBatch> result = repository.findAvailableBatchesForProductAndSize(product.getId(), "L");

        assertThat(result).extracting(InventoryBatch::getId).containsExactly(oldest.getId(), newest.getId());
    }

    @Test
    void returnsEmptyWhenSizeHasNoStock() {
        persistBatch(product, "M", 5, LocalDateTime.now());

        assertThat(repository.findAvailableBatchesForProductAndSize(product.getId(), "XL")).isEmpty();
    }

    private Product persistProduct(Category category, String sku) {
        Product p = new Product();
        p.setCategory(category);
        p.setSku(sku);
        p.setName("Producto " + sku);
        p.setSalePrice(new BigDecimal("1000.00"));
        return em.persist(p);
    }

    private InventoryBatch persistBatch(Product p, String size, int remaining, LocalDateTime createdAt) {
        InventoryBatch batch = new InventoryBatch();
        batch.setProduct(p);
        batch.setSize(size);
        batch.setQuantityProduced(Math.max(remaining, 1));
        batch.setQuantityRemaining(remaining);
        batch.setUnitCost(new BigDecimal("100.00"));
        em.persistAndFlush(batch);
        // createdAt lo fija @PrePersist; lo sobrescribimos para controlar el orden FIFO
        em.getEntityManager()
                .createQuery("UPDATE InventoryBatch b SET b.createdAt = :createdAt WHERE b.id = :id")
                .setParameter("createdAt", createdAt)
                .setParameter("id", batch.getId())
                .executeUpdate();
        em.clear();
        return batch;
    }
}
