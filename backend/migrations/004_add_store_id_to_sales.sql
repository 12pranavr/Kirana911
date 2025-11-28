-- Migration: Add store_id column to sales table
-- This migration adds the store_id column to the sales table to enable proper store-level data isolation

-- Add store_id column to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_sales_store_id ON sales(store_id);

-- Backfill existing sales with store_id from products
-- This will set the store_id for existing sales based on the product's store_id
UPDATE sales 
SET store_id = p.store_id
FROM products p
WHERE sales.product_id = p.id 
AND sales.store_id IS NULL;

-- Add RLS policies for sales table
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Owners can view their own sales" ON sales;
DROP POLICY IF EXISTS "Owners can insert their own sales" ON sales;
DROP POLICY IF EXISTS "Owners can update their own sales" ON sales;
DROP POLICY IF EXISTS "Owners can delete their own sales" ON sales;

-- Create new policies
CREATE POLICY "Owners can view their own sales" 
ON sales FOR SELECT 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    ) OR store_id IS NULL
);

CREATE POLICY "Owners can insert their own sales" 
ON sales FOR INSERT 
WITH CHECK (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    )
);

CREATE POLICY "Owners can update their own sales" 
ON sales FOR UPDATE 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    )
);

CREATE POLICY "Owners can delete their own sales" 
ON sales FOR DELETE 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    )
);

-- Allow admins to access all data
CREATE POLICY "Admins can access all sales" 
ON sales FOR ALL 
USING (
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email') 
        AND role = 'admin'
    )
);