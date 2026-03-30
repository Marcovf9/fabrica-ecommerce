package com.fabrica.ecommerce.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Data
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_code", nullable = false, unique = true, length = 20)
    private String orderCode;

    @Column(name = "customer_contact", length = 100)
    private String customerContact;

    @Column(name = "total_sale_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalSaleAmount;

    // Es nulo hasta que el pedido pasa a CONFIRMED y se calculan los lotes
    @Column(name = "total_cost_amount", precision = 10, scale = 2)
    private BigDecimal totalCostAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum OrderStatus {
        PENDING, CONFIRMED, CANCELLED
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}