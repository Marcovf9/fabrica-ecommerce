-- Insertar Categorías (Respetando el ENUM 'PLASTICO' y 'HIERRO')
INSERT INTO categories (name, type) VALUES ('Muebles de Exterior Sostenibles', 'PLASTICO');
INSERT INTO categories (name, type) VALUES ('Parrillas y Fogoneros Pesados', 'HIERRO');

-- Insertar Productos 
-- Asumiendo que Muebles de Exterior obtiene el ID 1 y Parrillas el ID 2
INSERT INTO products (category_id, sku, name, sale_price, is_active) 
VALUES (1, 'SLL-PLST-001', 'Silla de Madera Plástica Reforzada (Negro)', 45000.00, 1);

INSERT INTO products (category_id, sku, name, sale_price, is_active) 
VALUES (1, 'MSA-PLST-001', 'Mesa de Jardín Plástico Reciclado 1.5m', 120000.00, 1);

INSERT INTO products (category_id, sku, name, sale_price, is_active) 
VALUES (2, 'FOG-HRR-001', 'Fogonero Desarmable de Hierro 3.2mm', 85000.00, 1);

INSERT INTO products (category_id, sku, name, sale_price, is_active) 
VALUES (2, 'CHL-HRR-001', 'Chulengo Tradicional Tambor Reciclado', 150000.00, 1);

-- Insertar Lotes de Inventario (El núcleo de tu costo real)
-- Lote de 50 Sillas (Costo de producción unitario: $15,000)
INSERT INTO inventory_batches (product_id, quantity_produced, quantity_remaining, unit_cost, created_at) 
VALUES (1, 50, 50, 15000.00, CURRENT_TIMESTAMP);

-- Lote de 10 Mesas (Costo de producción unitario: $40,000)
INSERT INTO inventory_batches (product_id, quantity_produced, quantity_remaining, unit_cost, created_at) 
VALUES (2, 10, 10, 40000.00, CURRENT_TIMESTAMP);

-- Lote de 20 Fogoneros (Costo de producción unitario: $30,000)
INSERT INTO inventory_batches (product_id, quantity_produced, quantity_remaining, unit_cost, created_at) 
VALUES (3, 20, 20, 30000.00, CURRENT_TIMESTAMP);

-- Dos lotes distintos para el Chulengo para probar el FIFO en el futuro
-- Lote Viejo: 5 unidades a $50,000 de costo
INSERT INTO inventory_batches (product_id, quantity_produced, quantity_remaining, unit_cost, created_at) 
VALUES (4, 5, 5, 50000.00, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 5 DAY));

-- Lote Nuevo: 10 unidades a $65,000 de costo (Aumento de chatarra)
INSERT INTO inventory_batches (product_id, quantity_produced, quantity_remaining, unit_cost, created_at) 
VALUES (4, 10, 10, 65000.00, CURRENT_TIMESTAMP);