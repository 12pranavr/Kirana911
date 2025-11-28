# KIRANA911 - Database Setup Guide

## Quick Setup (Easiest Method)

### Option 1: Run Complete Setup Script (Recommended)

1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the entire contents of `setup/complete_setup.sql` and paste it
5. Click "Run" or press F5
6. ✅ Done! Your database is ready with dummy data

### Option 2: Step-by-Step Setup

If you prefer to run scripts separately:

1. **Create Schema**
   - Open `setup/schema.sql`
   - Copy and run in Supabase SQL Editor

2. **Add Seed Data**
   - Open `setup/seed_data.sql`
   - Copy and run in Supabase SQL Editor

3. **Add Customers Table** (Optional)
   - Open `setup/customers_table.sql`
   - Copy and run in Supabase SQL Editor

## What Data is Included?

### Customers
- Pranav
- Shravani
- Uday
- Srishanth

### Products (10 items)
- Rice 5kg
- Wheat Flour 10kg
- Sugar 1kg
- Oil - Sunflower 1L
- Dal Toor 1kg
- Tea Powder 500g
- Soap - Lux
- Detergent 1kg
- Biscuits - Parle-G
- Milk 1L

### Additional Data
- Initial stock levels for all products
- Sample sales transactions
- Budget data
- Financial transactions (income/expenses)

## Verifying Setup

After running the script, verify by running these queries:

```sql
-- Check products
SELECT COUNT(*) FROM products;
-- Should return: 10

-- Check customers
SELECT COUNT(*) FROM customers;
-- Should return: 4

-- Check stock levels
SELECT p.name, s.current_stock 
FROM products p 
JOIN stock_levels s ON p.id = s.product_id;
```

## Troubleshooting

**Error: "relation already exists"**
- This means tables are already created. You can skip schema creation or drop existing tables first.

**Error: "duplicate key value"**
- Seed data might already exist. Try running just the schema first, then seed data.

**RLS Policies blocking access?**
- The current policies allow all operations. For production, modify policies in Step 4 of the complete setup script.

## Next Steps

After setup:
1. Register a user in the frontend at http://localhost:5173/login
2. Login and explore the dashboard
3. Try adding new products via the Inventory page
4. Use the chatbot to query inventory
