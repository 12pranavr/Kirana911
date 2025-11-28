-- Test script to validate the setup fixes
-- This script tests that the table creation order is correct

-- First, drop all tables if they exist (in correct order to avoid foreign key issues)
DROP TABLE IF EXISTS budget, transactions, audit_logs, chat_logs, sales, stock_levels, customers, products, users;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables in the correct order
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

-- Customers table created BEFORE sales table
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

-- Sales table references customers table (which now exists)
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

-- If we reach this point without error, the table creation order is correct
SELECT 'SUCCESS: All tables created in correct order' as result;

-- Clean up test tables
DROP TABLE IF EXISTS sales, stock_levels, customers, products, users;