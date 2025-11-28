-- Migration: add segment column to customers and customer_id to sales
-- Add segment column to customers table (nullable)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS segment text;

-- Add customer_id column to sales table (nullable) referencing customers(id)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id);

-- Optionally, backfill existing sales with null customer_id (no action needed as default is null)
