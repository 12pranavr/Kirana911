-- Migration: Update sales source constraint to include 'online'
-- This migration updates the sales table constraint to allow 'online' as a valid source value

-- Drop the existing constraint
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_source_check;

-- Add the new constraint with 'online' included
ALTER TABLE sales ADD CONSTRAINT sales_source_check 
CHECK (source IN ('ocr', 'manual', 'online'));

-- Set default to 'manual' to maintain backward compatibility
ALTER TABLE sales ALTER COLUMN source SET DEFAULT 'manual';