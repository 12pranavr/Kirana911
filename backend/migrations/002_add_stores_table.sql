-- Migration: Add stores table and related columns
-- This migration adds the stores table and links products and users to stores

-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  phone text,
  address text,
  pincode text not null,
  latitude double precision,
  longitude double precision,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Enable read access for all users" ON stores FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON stores FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON stores FOR DELETE USING (true);

-- Add store_id column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id);

-- Add store_id column to users table to link owners to stores
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);
CREATE INDEX IF NOT EXISTS idx_stores_pincode ON stores(pincode);