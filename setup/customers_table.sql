-- Additional: Create a customers table if you want to track customer data separately
CREATE TABLE IF NOT EXISTS customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  phone text,
  address text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Add RLS policy
CREATE POLICY "Enable read access for all users" ON customers FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON customers FOR INSERT WITH CHECK (true);

-- Insert customer data
INSERT INTO customers (name, email, phone) VALUES
('Pranav', 'pranav@customer.com', '9876543210'),
('Shravani', 'shravani@customer.com', '9876543211'),
('Uday', 'uday@customer.com', '9876543212'),
('Srishanth', 'srishanth@customer.com', '9876543213');
