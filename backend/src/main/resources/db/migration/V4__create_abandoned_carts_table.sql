CREATE TABLE abandoned_carts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    cart_content TEXT,
    captured_at DATETIME,
    recovered BOOLEAN DEFAULT FALSE
);