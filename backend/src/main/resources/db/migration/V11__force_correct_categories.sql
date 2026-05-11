UPDATE categories SET name = 'Parrillas' WHERE id = 1;
UPDATE categories SET name = 'Chulengos' WHERE id = 2;
UPDATE categories SET name = 'Accesorios' WHERE id = 3;
UPDATE categories SET name = 'Fogoneros' WHERE id = 4;
UPDATE categories SET name = 'Muebles de exterior sostenibles' WHERE id = 5;

DELETE FROM categories WHERE id > 5 AND id NOT IN (SELECT DISTINCT category_id FROM products);