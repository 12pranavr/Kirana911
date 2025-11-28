-- Fix RLS Policies to allow anon key access
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable all for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON stock_levels;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON sales;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON transactions;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON budget;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON chat_logs;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON audit_logs;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON users;

-- Create new policies that allow anon key access
CREATE POLICY "Allow all access" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON stock_levels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON budget FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON chat_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON users FOR ALL USING (true) WITH CHECK (true);
