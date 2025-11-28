-- Run this SQL script in your Supabase SQL editor to add image_url columns to stores and products tables

-- Add image_url column to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stores_image_url ON stores(image_url);
CREATE INDEX IF NOT EXISTS idx_products_image_url ON products(image_url);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'stores' AND column_name = 'image_url';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'image_url';