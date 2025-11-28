-- Create stores table for multi-store functionality
CREATE TABLE IF NOT EXISTS stores (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  phone text,
  address text,
  pincode text not null,
  latitude double precision,
  longitude double precision,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Add RLS policy
CREATE POLICY "Enable read access for all users" ON stores FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON stores FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON stores FOR DELETE USING (true);

-- Add store_id column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id);

-- Add store_id column to users table to link owners to stores
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id);

-- Insert sample stores
INSERT INTO stores (name, email, phone, address, pincode, latitude, longitude) VALUES
('Main Street Kirana', 'mainstreet@kirana911.com', '9876543210', '123 Main Street, Sector 15', '123456', 28.613939, 77.209021),
('Market Road Store', 'marketroad@kirana911.com', '9876543211', '456 Market Road, Sector 12', '123457', 28.623939, 77.219021),
('Commercial Complex Shop', 'commercial@kirana911.com', '9876543212', '789 Commercial Complex, Sector 10', '123458', 28.633939, 77.229021),
('Shopping Center Store', 'shoppingcenter@kirana911.com', '9876543213', '101 Shopping Center, Sector 8', '123459', 28.643939, 77.239021);