ALTER TABLE products ADD COLUMN description TEXT;

CREATE TABLE product_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Migrar la imagen actual a la nueva tabla de galería
INSERT INTO product_images (product_id, image_url, is_primary)
SELECT id, image_url, TRUE FROM products WHERE image_url IS NOT NULL;

-- Eliminar la columna obsoleta
ALTER TABLE products DROP COLUMN image_url;