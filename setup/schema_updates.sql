-- Add store_id column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id);

-- Add store_id column to budget table
ALTER TABLE budget ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id);

-- Add RLS policies for transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for transactions
CREATE POLICY "Enable read access for store owners" ON transactions 
FOR SELECT USING (store_id IN (SELECT id FROM stores WHERE id = store_id));

CREATE POLICY "Enable insert for store owners" ON transactions 
FOR INSERT WITH CHECK (store_id IN (SELECT id FROM stores WHERE id = store_id));

CREATE POLICY "Enable update for store owners" ON transactions 
FOR UPDATE USING (store_id IN (SELECT id FROM stores WHERE id = store_id));

CREATE POLICY "Enable delete for store owners" ON transactions 
FOR DELETE USING (store_id IN (SELECT id FROM stores WHERE id = store_id));

-- Create policies for budget
CREATE POLICY "Enable read access for store owners" ON budget 
FOR SELECT USING (store_id IN (SELECT id FROM stores WHERE id = store_id));

CREATE POLICY "Enable insert for store owners" ON budget 
FOR INSERT WITH CHECK (store_id IN (SELECT id FROM stores WHERE id = store_id));

CREATE POLICY "Enable update for store owners" ON budget 
FOR UPDATE USING (store_id IN (SELECT id FROM stores WHERE id = store_id));

CREATE POLICY "Enable delete for store owners" ON budget 
FOR DELETE USING (store_id IN (SELECT id FROM stores WHERE id = store_id));