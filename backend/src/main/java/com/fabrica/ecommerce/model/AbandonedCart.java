package com.fabrica.ecommerce.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "abandoned_carts")
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

    @PrePersist
    @PreUpdate
    protected void onSave() {
        capturedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public String getCartContent() { return cartContent; }
    public void setCartContent(String cartContent) { this.cartContent = cartContent; }
    public LocalDateTime getCapturedAt() { return capturedAt; }
    public void setCapturedAt(LocalDateTime capturedAt) { this.capturedAt = capturedAt; }
    public boolean isRecovered() { return recovered; }
    public void setRecovered(boolean recovered) { this.recovered = recovered; }
}