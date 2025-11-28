-- Migration: Add store_id column to customers table
-- This migration adds the store_id column to link customers to specific stores

-- Add store_id column to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_customers_store_id ON customers(store_id);

-- Add RLS policy for customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policies for customers
CREATE POLICY "Owners can view their own customers" 
ON customers FOR SELECT 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    ) OR store_id IS NULL
);

CREATE POLICY "Owners can insert their own customers" 
ON customers FOR INSERT 
WITH CHECK (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    )
);

CREATE POLICY "Owners can update their own customers" 
ON customers FOR UPDATE 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    )
);

CREATE POLICY "Owners can delete their own customers" 
ON customers FOR DELETE 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    )
);

-- Allow admins to access all customers
CREATE POLICY "Admins can access all customers" 
ON customers FOR ALL 
USING (
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email') 
        AND role = 'admin'
    )
);