-- Tabla para guardar las múltiples medidas de un producto
CREATE TABLE product_sizes (
    product_id BIGINT NOT NULL,
    size VARCHAR(255) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Columna para registrar qué medida eligió el cliente al comprar
ALTER TABLE order_items ADD COLUMN size VARCHAR(255);