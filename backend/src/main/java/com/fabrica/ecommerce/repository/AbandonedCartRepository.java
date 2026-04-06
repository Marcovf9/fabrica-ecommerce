package com.fabrica.ecommerce.repository;

import com.fabrica.ecommerce.model.AbandonedCart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AbandonedCartRepository extends JpaRepository<AbandonedCart, Long> {
    Optional<AbandonedCart> findByCustomerEmailOrCustomerPhone(String email, String phone);

    @Query("SELECT a FROM AbandonedCart a WHERE a.customerEmail IS NOT NULL AND a.customerEmail != '' AND a.notified = false AND a.capturedAt < :threshold")
    List<AbandonedCart> findUnnotifiedAbandonedCarts(@Param("threshold") LocalDateTime threshold);
    List<AbandonedCart> findByRecoveredFalse();
}