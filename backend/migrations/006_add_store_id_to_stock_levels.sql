-- Migration: Add store_id column to stock_levels table
-- This migration adds the store_id column to the stock_levels table to enable proper store-level data isolation

-- Add store_id column to stock_levels table
ALTER TABLE stock_levels ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_stock_levels_store_id ON stock_levels(store_id);

-- Backfill existing stock_levels with store_id from products
-- This will set the store_id for existing stock levels based on the product's store_id
UPDATE stock_levels 
SET store_id = p.store_id
FROM products p
WHERE stock_levels.product_id = p.id 
AND stock_levels.store_id IS NULL;

-- Add RLS policies for stock_levels table
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Owners can view their own stock levels" ON stock_levels;
DROP POLICY IF EXISTS "Owners can insert their own stock levels" ON stock_levels;
DROP POLICY IF EXISTS "Owners can update their own stock levels" ON stock_levels;
DROP POLICY IF EXISTS "Owners can delete their own stock levels" ON stock_levels;

-- Create new policies
CREATE POLICY "Owners can view their own stock levels" 
ON stock_levels FOR SELECT 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    ) OR store_id IS NULL
);

CREATE POLICY "Owners can insert their own stock levels" 
ON stock_levels FOR INSERT 
WITH CHECK (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    )
);

CREATE POLICY "Owners can update their own stock levels" 
ON stock_levels FOR UPDATE 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    )
);

CREATE POLICY "Owners can delete their own stock levels" 
ON stock_levels FOR DELETE 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    )
);

-- Allow admins to access all data
CREATE POLICY "Admins can access all stock levels" 
ON stock_levels FOR ALL 
USING (
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email') 
        AND role = 'admin'
    )
);