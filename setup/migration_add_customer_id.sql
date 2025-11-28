-- Migration: Add customer_id to sales table
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id);

-- Optional: Update existing sales to link to a dummy customer if needed, or leave null
-- UPDATE sales SET customer_id = (SELECT id FROM customers LIMIT 1) WHERE customer_id IS NULL;
