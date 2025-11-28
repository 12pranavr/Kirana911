-- Create a test user in the users table
-- Note: This user still needs to be registered through Supabase Auth to login
INSERT INTO users (name, email, password_hash, role) VALUES
('Test Owner', 'test@kirana911.com', '$2b$10$dummy_hash_test_owner', 'owner')
ON CONFLICT (email) DO UPDATE SET 
  name = 'Test Owner',
  role = 'owner';