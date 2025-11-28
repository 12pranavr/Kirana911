-- Migration: add transaction_id column to sales table
-- Add transaction_id column to sales table (nullable) referencing transactions(id)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS transaction_id uuid REFERENCES transactions(id);

-- Optionally, backfill existing sales with null transaction_id (no action needed as default is null)