-- Add role column to customers table if it doesn't exist
alter table customers add column if not exists role text default 'Member';

-- Clear existing customers to ensure only the 4 members exist
delete from customers;

-- Insert the 4 specific members with roles
insert into customers (name, role) values 
('Pranav', 'Head'),
('Shravani', 'Manager'),
('Srishanth', 'Cashier'),
('Uday', 'Logistics');
