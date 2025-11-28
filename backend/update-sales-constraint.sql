-- Update sales table to allow 'online' as a valid source value
ALTER TABLE sales 
DROP CONSTRAINT IF EXISTS sales_source_check;

ALTER TABLE sales 
ADD CONSTRAINT sales_source_check 
CHECK (source IN ('ocr', 'manual', 'online'));