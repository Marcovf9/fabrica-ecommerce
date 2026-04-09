package com.fabrica.ecommerce.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "abandoned_carts")
@Data
public class AbandonedCart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_email")
    private String customerEmail;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Column(name = "cart_content", columnDefinition = "TEXT")
    private String cartContent;

    @Column(name = "captured_at")
    private LocalDateTime capturedAt;

    @Column(name = "recovered")
    private boolean recovered = false;

    @Column(nullable = false)
    private boolean notified = false;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        capturedAt = LocalDateTime.now();
    }
}