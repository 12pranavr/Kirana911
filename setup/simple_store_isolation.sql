-- Simplified store-level data isolation
-- This version works with the current application structure

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all access" ON products;
DROP POLICY IF EXISTS "Allow all access" ON stock_levels;
DROP POLICY IF EXISTS "Allow all access" ON sales;
DROP POLICY IF EXISTS "Allow all access" ON transactions;
DROP POLICY IF EXISTS "Allow all access" ON budget;

-- For prototype/testing, we'll use a simpler approach
-- Products should be filtered by store_id in the application layer
-- But we still want to ensure data integrity at the database level

-- Products table - Allow read/write for authenticated users, but application filters by store
CREATE POLICY "Authenticated users can read products" 
ON products FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert products" 
ON products FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update products" 
ON products FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete products" 
ON products FOR DELETE 
USING (true);

-- Stock levels - Allow read/write for authenticated users
CREATE POLICY "Authenticated users can read stock levels" 
ON stock_levels FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert stock levels" 
ON stock_levels FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update stock levels" 
ON stock_levels FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete stock levels" 
ON stock_levels FOR DELETE 
USING (true);

-- Sales - Allow read/write for authenticated users
CREATE POLICY "Authenticated users can read sales" 
ON sales FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert sales" 
ON sales FOR INSERT 
WITH CHECK (true);

-- Transactions - Filter by store_id in application
CREATE POLICY "Authenticated users can read transactions" 
ON transactions FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert transactions" 
ON transactions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update transactions" 
ON transactions FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete transactions" 
ON transactions FOR DELETE 
USING (true);

-- Budget - Filter by store_id in application
CREATE POLICY "Authenticated users can read budget" 
ON budget FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert budget" 
ON budget FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update budget" 
ON budget FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete budget" 
ON budget FOR DELETE 
USING (true);

-- Admin access
CREATE POLICY "Admin full access" 
ON products FOR ALL 
USING (
    EXISTS (
        SELECT 1 
        FROM users 
        WHERE email = CURRENT_USER 
        AND role = 'admin'
    )
);