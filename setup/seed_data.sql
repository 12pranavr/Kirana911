-- KIRANA911 Seed Data
-- Run this in your Supabase SQL Editor after running schema.sql

-- Insert dummy customers (as users with 'staff' role)
INSERT INTO users (name, email, password_hash, role) VALUES
('Pranav', 'pranav@kirana911.com', '$2a$10$dummy_hash_pranav', 'staff'),
('Shravani', 'shravani@kirana911.com', '$2a$10$dummy_hash_shravani', 'staff'),
('Uday', 'uday@kirana911.com', '$2a$10$dummy_hash_uday', 'staff'),
('Srishanth', 'srishanth@kirana911.com', '$2a$10$dummy_hash_srishanth', 'staff');

-- Insert dummy products
INSERT INTO products (sku_id, name, category, cost_price, selling_price, reorder_point, supplier_info, active) VALUES
('SKU001', 'Rice 5kg', 'Grains', 180.00, 220.00, 10, 'AgroMart Suppliers', true),
('SKU002', 'Wheat Flour 10kg', 'Grains', 350.00, 420.00, 8, 'AgroMart Suppliers', true),
('SKU003', 'Sugar 1kg', 'Essentials', 40.00, 50.00, 15, 'Local Distributor', true),
('SKU004', 'Oil - Sunflower 1L', 'Cooking', 120.00, 150.00, 12, 'Oil Traders Ltd', true),
('SKU005', 'Dal Toor 1kg', 'Pulses', 100.00, 130.00, 10, 'Pulse Suppliers', true),
('SKU006', 'Tea Powder 500g', 'Beverages', 180.00, 220.00, 20, 'Tea House', true),
('SKU007', 'Soap - Lux', 'Personal Care', 25.00, 35.00, 30, 'FMCG Distributor', true),
('SKU008', 'Detergent 1kg', 'Household', 80.00, 110.00, 15, 'Home Care Ltd', true),
('SKU009', 'Biscuits - Parle-G', 'Snacks', 10.00, 15.00, 50, 'Snacks Supplier', true),
('SKU010', 'Milk 1L', 'Dairy', 50.00, 60.00, 20, 'Dairy Fresh', true);

-- Insert initial stock levels for products
INSERT INTO stock_levels (product_id, current_stock, updated_at)
SELECT id, 
  CASE 
    WHEN name LIKE '%Rice%' THEN 50
    WHEN name LIKE '%Wheat%' THEN 40
    WHEN name LIKE '%Sugar%' THEN 60
    WHEN name LIKE '%Oil%' THEN 35
    WHEN name LIKE '%Dal%' THEN 45
    WHEN name LIKE '%Tea%' THEN 80
    WHEN name LIKE '%Soap%' THEN 100
    WHEN name LIKE '%Detergent%' THEN 55
    WHEN name LIKE '%Biscuits%' THEN 150
    WHEN name LIKE '%Milk%' THEN 30
    ELSE 25
  END as stock,
  NOW()
FROM products;

-- Insert some dummy sales transactions
INSERT INTO sales (product_id, date, qty_sold, unit_price, total_price, source)
SELECT 
  id,
  NOW() - INTERVAL '5 days',
  FLOOR(RANDOM() * 10 + 5)::int,
  selling_price,
  selling_price * FLOOR(RANDOM() * 10 + 5)::int,
  'manual'
FROM products
LIMIT 5;

-- Insert some recent sales (last 2 days)
INSERT INTO sales (product_id, date, qty_sold, unit_price, total_price, source)
SELECT 
  id,
  NOW() - INTERVAL '1 day',
  FLOOR(RANDOM() * 8 + 3)::int,
  selling_price,
  selling_price * FLOOR(RANDOM() * 8 + 3)::int,
  'manual'
FROM products
WHERE name IN ('Rice 5kg', 'Sugar 1kg', 'Milk 1L', 'Biscuits - Parle-G');

-- Insert dummy transactions (sales as income)
INSERT INTO transactions (date, type, category, amount, note)
VALUES
(NOW() - INTERVAL '5 days', 'sale', 'Product Sales', 2500.00, 'Daily sales'),
(NOW() - INTERVAL '4 days', 'sale', 'Product Sales', 3200.00, 'Daily sales'),
(NOW() - INTERVAL '3 days', 'expense', 'Utilities', 500.00, 'Electricity bill'),
(NOW() - INTERVAL '2 days', 'sale', 'Product Sales', 2800.00, 'Daily sales'),
(NOW() - INTERVAL '1 day', 'sale', 'Product Sales', 3500.00, 'Daily sales'),
(NOW(), 'expense', 'Supplier Payment', 15000.00, 'Monthly stock purchase');

-- Insert a monthly budget
INSERT INTO budget (month, income_target, expense_limit, category_limits)
VALUES
(TO_CHAR(NOW(), 'YYYY-MM'), 100000.00, 80000.00, '{"utilities": 5000, "supplies": 50000, "salaries": 20000}'::jsonb);
