# Kirana App Supabase Setup Instructions

This guide explains how to properly set up your Supabase database for the Kirana app to avoid the "relation 'customers' does not exist" error.

## Issue Explanation

The error occurs because the database tables were being created in the wrong order. Specifically, the `sales` table was trying to reference the `customers` table before the `customers` table was created.

## Solution Implemented

We've fixed the [complete_setup.sql](file:///c%3A/Users/ankit/Downloads/kirana-app/kirana-app/setup/complete_setup.sql) file to ensure proper table creation order:

1. Create the `customers` table before the `sales` table
2. Update the sample data insertion to include `customer_id` values

## Setup Steps

1. **Create a new Supabase project**
   - Go to [Supabase Dashboard](https://app.supabase.com/)
   - Click "New Project"
   - Enter project details and create

2. **Run the Complete Setup Script**
   - Once your database is ready, go to the SQL Editor in your Supabase dashboard
   - Copy the entire content of `setup/complete_setup.sql`
   - Paste it into the SQL Editor
   - Click "Run"

3. **Verify Setup Success**
   - You should see a success message indicating all queries ran successfully
   - Check the "Table Editor" to confirm all tables were created

## Alternative Approach (Step-by-Step)

If you prefer to set up the database step by step:

1. First, run `setup/schema.sql` to create the basic schema
2. Then, run `setup/customers_table.sql` to add the customers table
3. Finally, run `backend/migrations/add_customer_sales_columns.sql` to add the customer reference to sales

## Troubleshooting

**If you still encounter errors:**

1. Make sure you're running the complete script in one go, not individual parts
2. Check that you're using a fresh database (drop existing tables if needed)
3. Ensure you have the latest version of the setup files

## Tables Created

The setup creates these tables:
- `users` - Application users (owners, staff)
- `products` - Store products with pricing and inventory info
- `stock_levels` - Current inventory levels
- `sales` - Sales transactions with customer references
- `transactions` - Financial transactions (income, expenses)
- `budget` - Monthly budget targets
- `chat_logs` - AI chat conversation history
- `audit_logs` - System audit trail
- `customers` - Customer information

All tables have Row Level Security (RLS) enabled with permissive policies for prototyping.

## Next Steps

After successful database setup:
1. Update your `.env` files in both `backend` and `frontend` directories with your Supabase credentials
2. Run the backend server with `npm start` in the backend directory
3. Run the frontend with `npm run dev` in the frontend directory