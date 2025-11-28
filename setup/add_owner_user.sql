-- Add an owner user for testing
INSERT INTO users (name, email, password_hash, role) VALUES
('Store Owner', 'owner@kirana911.com', '$2a$10$dummy_hash_owner', 'owner');