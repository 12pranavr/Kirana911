-- Migration: Add image_url columns to stores and products tables
-- This migration adds image_url columns to support storing image URLs for stores and products

-- Add image_url column to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS image_url text;

-- Add image_url column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stores_image_url ON stores(image_url);
CREATE INDEX IF NOT EXISTS idx_products_image_url ON products(image_url);