-- Ensure store isolation is properly set up
-- This script ensures that all tables have the proper store_id columns and RLS policies

-- Add store_id column to customers table if it doesn't exist
ALTER TABLE customers ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);
CREATE INDEX IF NOT EXISTS idx_customers_store_id ON customers(store_id);
CREATE INDEX IF NOT EXISTS idx_stores_pincode ON stores(pincode);

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Owners can view their own products" ON products;
DROP POLICY IF EXISTS "Owners can insert their own products" ON products;
DROP POLICY IF EXISTS "Owners can update their own products" ON products;
DROP POLICY IF EXISTS "Owners can delete their own products" ON products;

DROP POLICY IF EXISTS "Owners can view their own stock levels" ON stock_levels;
DROP POLICY IF EXISTS "Owners can insert their own stock levels" ON stock_levels;
DROP POLICY IF EXISTS "Owners can update their own stock levels" ON stock_levels;
DROP POLICY IF EXISTS "Owners can delete their own stock levels" ON stock_levels;

DROP POLICY IF EXISTS "Owners can view their own sales" ON sales;
DROP POLICY IF EXISTS "Owners can insert their own sales" ON sales;

DROP POLICY IF EXISTS "Owners can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Owners can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Owners can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Owners can delete their own transactions" ON transactions;

DROP POLICY IF EXISTS "Owners can view their own budget" ON budget;
DROP POLICY IF EXISTS "Owners can insert their own budget" ON budget;
DROP POLICY IF EXISTS "Owners can update their own budget" ON budget;
DROP POLICY IF EXISTS "Owners can delete their own budget" ON budget;

DROP POLICY IF EXISTS "Owners can view their own customers" ON customers;
DROP POLICY IF EXISTS "Owners can insert their own customers" ON customers;
DROP POLICY IF EXISTS "Owners can update their own customers" ON customers;
DROP POLICY IF EXISTS "Owners can delete their own customers" ON customers;

-- Create new policies for products
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

CREATE POLICY "Owners can delete their own products" 
ON products FOR DELETE 
USING (
    store_id IN (
        SELECT store_id 
        FROM users 
        WHERE email = (SELECT auth.jwt() ->> 'email')
        AND store_id IS NOT NULL
    )
);

-- Create new policies for stock_levels
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
            AND store_id IS NOT NULL
        )
    )
);

-- Create new policies for sales
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

-- Create new policies for transactions
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

-- Create new policies for budget
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

-- Create new policies for customers
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

-- Allow admins to access all data
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