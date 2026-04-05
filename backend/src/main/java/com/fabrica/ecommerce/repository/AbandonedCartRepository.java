package com.fabrica.ecommerce.repository;

import com.fabrica.ecommerce.model.AbandonedCart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AbandonedCartRepository extends JpaRepository<AbandonedCart, Long> {
    Optional<AbandonedCart> findByCustomerEmailOrCustomerPhone(String email, String phone);

    List<AbandonedCart> findByRecoveredFalse();
}