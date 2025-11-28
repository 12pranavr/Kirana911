-- Implement proper store-level data isolation
-- Run this in Supabase SQL Editor

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all access" ON products;
DROP POLICY IF EXISTS "Allow all access" ON stock_levels;
DROP POLICY IF EXISTS "Allow all access" ON sales;
DROP POLICY IF EXISTS "Allow all access" ON transactions;
DROP POLICY IF EXISTS "Allow all access" ON budget;

-- Create proper RLS policies for store-level isolation

-- Products table
CREATE POLICY "Owners can view their own products" 
ON products FOR SELECT 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
    )
);

CREATE POLICY "Owners can insert their own products" 
ON products FOR INSERT 
WITH CHECK (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
    )
);

CREATE POLICY "Owners can update their own products" 
ON products FOR UPDATE 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
    )
);

CREATE POLICY "Owners can delete their own products" 
ON products FOR DELETE 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
    )
);

-- Stock levels table
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
        )
    )
);

CREATE POLICY "Owners can delete their own stock levels" 
ON stock_levels FOR DELETE 
USING (
    product_id IN (
        SELECT id 
        FROM products 
        WHERE store_id IN (
            SELECT store_id 
            FROM users 
            WHERE email = (SELECT auth.jwt() ->> 'email')
        )
    )
);

-- Sales table
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
        )
    )
);

-- Transactions table
CREATE POLICY "Owners can view their own transactions" 
ON transactions FOR SELECT 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
    )
);

CREATE POLICY "Owners can insert their own transactions" 
ON transactions FOR INSERT 
WITH CHECK (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
    )
);

CREATE POLICY "Owners can update their own transactions" 
ON transactions FOR UPDATE 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
    )
);

CREATE POLICY "Owners can delete their own transactions" 
ON transactions FOR DELETE 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
    )
);

-- Budget table
CREATE POLICY "Owners can view their own budget" 
ON budget FOR SELECT 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
    )
);

CREATE POLICY "Owners can insert their own budget" 
ON budget FOR INSERT 
WITH CHECK (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
    )
);

CREATE POLICY "Owners can update their own budget" 
ON budget FOR UPDATE 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
    )
);

CREATE POLICY "Owners can delete their own budget" 
ON budget FOR DELETE 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
    )
);

-- Allow admins to access all data
CREATE POLICY "Admins can access all data" 
ON products FOR ALL 
USING (
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email') 
        AND role = 'admin'
    )
);

CREATE POLICY "Admins can access all data" 
ON stock_levels FOR ALL 
USING (
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email') 
        AND role = 'admin'
    )
);

CREATE POLICY "Admins can access all data" 
ON sales FOR ALL 
USING (
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email') 
        AND role = 'admin'
    )
);

CREATE POLICY "Admins can access all data" 
ON transactions FOR ALL 
USING (
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email') 
        AND role = 'admin'
    )
);

CREATE POLICY "Admins can access all data" 
ON budget FOR ALL 
USING (
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email') 
        AND role = 'admin'
    )
);