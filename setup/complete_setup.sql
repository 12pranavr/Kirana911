-- COMPLETE SETUP SCRIPT
-- Run this entire script in Supabase SQL Editor
-- This includes schema, seed data, and customers

-- Step 1: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create all tables
CREATE TABLE IF NOT EXISTS users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  role text check (role in ('owner', 'staff')) not null,
  created_at timestamp with time zone default now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid primary key default uuid_generate_v4(),
  sku_id text unique not null,
  name text not null,
  category text,
  cost_price float not null,
  selling_price float not null,
  reorder_point int default 10,
  supplier_info text,
  active boolean default true,
  created_at timestamp with time zone default now()
);

CREATE TABLE IF NOT EXISTS customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  phone text,
  address text,
  created_at timestamp with time zone default now()
);

CREATE TABLE IF NOT EXISTS stock_levels (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  current_stock int default 0,
  updated_at timestamp with time zone default now()
);

CREATE TABLE IF NOT EXISTS sales (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id),
  date timestamp with time zone default now(),
  qty_sold int not null,
  unit_price float not null,
  total_price float not null,
  source text check (source in ('ocr', 'manual')) default 'manual',
  customer_id uuid references customers(id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid primary key default uuid_generate_v4(),
  date timestamp with time zone default now(),
  type text check (type in ('income', 'expense', 'sale', 'refund')),
  category text,
  amount float not null,
  note text,
  related_product_id uuid references products(id),
  added_by uuid references users(id)
);

CREATE TABLE IF NOT EXISTS budget (
  id uuid primary key default uuid_generate_v4(),
  month text not null,
  income_target float,
  expense_limit float,
  category_limits jsonb,
  created_by uuid references users(id)
);

CREATE TABLE IF NOT EXISTS chat_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  store_id uuid references stores(id),
  message text,
  response text,
  timestamp timestamp with time zone default now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  action text not null,
  table_name text,
  details jsonb,
  timestamp timestamp with time zone default now()
);

-- Step 3: Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies (Enable full access for prototype - adjust for production)
CREATE POLICY "Enable all for authenticated users" ON products FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON stock_levels FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON sales FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON transactions FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON budget FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON chat_logs FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON audit_logs FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON customers FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON users FOR ALL USING (true);

-- Step 5: Insert dummy customers
INSERT INTO customers (name, email, phone) VALUES
('Pranav', 'pranav@customer.com', '9876543210'),
('Shravani', 'shravani@customer.com', '9876543211'),
('Uday', 'uday@customer.com', '9876543212'),
('Srishanth', 'srishanth@customer.com', '9876543213');

-- Step 6: Insert dummy products
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

-- Step 7: Insert initial stock levels for products
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

-- Step 8: Insert some dummy sales transactions
INSERT INTO sales (product_id, date, qty_sold, unit_price, total_price, source, customer_id)
SELECT 
  p.id,
  NOW() - INTERVAL '5 days',
  FLOOR(RANDOM() * 10 + 5)::int,
  p.selling_price,
  p.selling_price * FLOOR(RANDOM() * 10 + 5)::int,
  'manual',
  c.id
FROM products p
CROSS JOIN customers c
LIMIT 5;

-- Step 9: Insert some recent sales (last 2 days)
INSERT INTO sales (product_id, date, qty_sold, unit_price, total_price, source, customer_id)
SELECT 
  p.id,
  NOW() - INTERVAL '1 day',
  FLOOR(RANDOM() * 8 + 3)::int,
  p.selling_price,
  p.selling_price * FLOOR(RANDOM() * 8 + 3)::int,
  'manual',
  c.id
FROM products p
CROSS JOIN customers c
WHERE p.name IN ('Rice 5kg', 'Sugar 1kg', 'Milk 1L', 'Biscuits - Parle-G')
LIMIT 4;

-- Step 10: Insert dummy transactions (sales as income)
INSERT INTO transactions (date, type, category, amount, note)
VALUES
(NOW() - INTERVAL '5 days', 'sale', 'Product Sales', 2500.00, 'Daily sales'),
(NOW() - INTERVAL '4 days', 'sale', 'Product Sales', 3200.00, 'Daily sales'),
(NOW() - INTERVAL '3 days', 'expense', 'Utilities', 500.00, 'Electricity bill'),
(NOW() - INTERVAL '2 days', 'sale', 'Product Sales', 2800.00, 'Daily sales'),
(NOW() - INTERVAL '1 day', 'sale', 'Product Sales', 3500.00, 'Daily sales'),
(NOW(), 'expense', 'Supplier Payment', 15000.00, 'Monthly stock purchase');

-- Step 11: Insert a monthly budget
INSERT INTO budget (month, income_target, expense_limit, category_limits)
VALUES
(TO_CHAR(NOW(), 'YYYY-MM'), 100000.00, 80000.00, '{"utilities": 5000, "supplies": 50000, "salaries": 20000}'::jsonb);
