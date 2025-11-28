-- Migration: Add store_id column to transactions table
-- This migration adds the store_id column to the transactions table to enable proper store-level data isolation

-- Add store_id column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_store_id ON transactions(store_id);

-- Backfill existing transactions with store_id from sales
-- This will set the store_id for existing transactions based on associated sales
UPDATE transactions 
SET store_id = s.store_id
FROM sales s
WHERE transactions.id = s.transaction_id 
AND transactions.store_id IS NULL;

-- For transactions without associated sales, try to get store_id from the user who added it
UPDATE transactions 
SET store_id = u.store_id
FROM users u
WHERE transactions.added_by = u.id 
AND transactions.store_id IS NULL
AND u.store_id IS NOT NULL;

-- Add RLS policies for transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Owners can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Owners can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Owners can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Owners can delete their own transactions" ON transactions;

-- Create new policies
CREATE POLICY "Owners can view their own transactions" 
ON transactions FOR SELECT 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    ) OR store_id IS NULL
);

CREATE POLICY "Owners can insert their own transactions" 
ON transactions FOR INSERT 
WITH CHECK (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    )
);

CREATE POLICY "Owners can update their own transactions" 
ON transactions FOR UPDATE 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    )
);

CREATE POLICY "Owners can delete their own transactions" 
ON transactions FOR DELETE 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    )
);

-- Allow admins to access all data
CREATE POLICY "Admins can access all transactions" 
ON transactions FOR ALL 
USING (
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email') 
        AND role = 'admin'
    )
);