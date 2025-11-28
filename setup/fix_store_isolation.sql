-- Fix store-level data isolation
-- This script properly implements RLS policies for multi-store data separation

-- First, ensure all necessary columns exist
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id);
ALTER TABLE budget ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id);

-- Drop existing incorrect policies
DROP POLICY IF EXISTS "Enable read access for store owners" ON transactions;
DROP POLICY IF EXISTS "Enable insert for store owners" ON transactions;
DROP POLICY IF EXISTS "Enable update for store owners" ON transactions;
DROP POLICY IF EXISTS "Enable delete for store owners" ON transactions;
DROP POLICY IF EXISTS "Enable read access for store owners" ON budget;
DROP POLICY IF EXISTS "Enable insert for store owners" ON budget;
DROP POLICY IF EXISTS "Enable update for store owners" ON budget;
DROP POLICY IF EXISTS "Enable delete for store owners" ON budget;

-- Create proper RLS policies for transactions table
CREATE POLICY "Owners can view their own transactions" 
ON transactions FOR SELECT 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    )
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

-- Create proper RLS policies for budget table
CREATE POLICY "Owners can view their own budget" 
ON budget FOR SELECT 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    )
);

CREATE POLICY "Owners can insert their own budget" 
ON budget FOR INSERT 
WITH CHECK (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    )
);

CREATE POLICY "Owners can update their own budget" 
ON budget FOR UPDATE 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    )
);

CREATE POLICY "Owners can delete their own budget" 
ON budget FOR DELETE 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    )
);

-- Update products table policies to include store filtering
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for all users" ON products;
DROP POLICY IF EXISTS "Enable update for all users" ON products;

CREATE POLICY "Owners can view their own products" 
ON products FOR SELECT 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    ) OR store_id IS NULL
);

CREATE POLICY "Owners can insert their own products" 
ON products FOR INSERT 
WITH CHECK (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    )
);

CREATE POLICY "Owners can update their own products" 
ON products FOR UPDATE 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    )
);

-- Update sales table policies to include store filtering
DROP POLICY IF EXISTS "Enable read access for all users" ON sales;
DROP POLICY IF EXISTS "Enable insert for all users" ON sales;
DROP POLICY IF EXISTS "Enable update for all users" ON sales;

CREATE POLICY "Owners can view their own sales" 
ON sales FOR SELECT 
USING (
    product_id IN (
        SELECT id 
        FROM products 
        WHERE store_id IN (
            SELECT store_id 
            FROM users 
            WHERE email = (SELECT auth.jwt() ->> 'email')
            AND store_id IS NOT NULL
        )
    )
);

CREATE POLICY "Owners can insert their own sales" 
ON sales FOR INSERT 
WITH CHECK (
    product_id IN (
        SELECT id 
        FROM products 
        WHERE store_id IN (
            SELECT store_id 
            FROM users 
            WHERE email = (SELECT auth.jwt() ->> 'email')
            AND store_id IS NOT NULL
        )
    )
);

-- Update stock_levels table policies to include store filtering
DROP POLICY IF EXISTS "Enable read access for all users" ON stock_levels;
DROP POLICY IF EXISTS "Enable insert for all users" ON stock_levels;
DROP POLICY IF EXISTS "Enable update for all users" ON stock_levels;

CREATE POLICY "Owners can view their own stock levels" 
ON stock_levels FOR SELECT 
USING (
    product_id IN (
        SELECT id 
        FROM products 
        WHERE store_id IN (
            SELECT store_id 
            FROM users 
            WHERE email = (SELECT auth.jwt() ->> 'email')
            AND store_id IS NOT NULL
        )
    )
);

CREATE POLICY "Owners can insert their own stock levels" 
ON stock_levels FOR INSERT 
WITH CHECK (
    product_id IN (
        SELECT id 
        FROM products 
        WHERE store_id IN (
            SELECT store_id 
            FROM users 
            WHERE email = (SELECT auth.jwt() ->> 'email')
            AND store_id IS NOT NULL
        )
    )
);

CREATE POLICY "Owners can update their own stock levels" 
ON stock_levels FOR UPDATE 
USING (
    product_id IN (
        SELECT id 
        FROM products 
        WHERE store_id IN (
            SELECT store_id 
            FROM users 
            WHERE email = (SELECT auth.jwt() ->> 'email')
            AND store_id IS NOT NULL
        )
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

CREATE POLICY "Admins can access all budget" 
ON budget FOR ALL 
USING (
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email') 
        AND role = 'admin'
    )
);

CREATE POLICY "Admins can access all products" 
ON products FOR ALL 
USING (
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email') 
        AND role = 'admin'
    )
);

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