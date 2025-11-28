# Store Data Isolation Setup

This document explains how to properly set up store-level data isolation in the Kirana app to ensure each store only sees its own data.

## Problem

Currently, all stores are seeing merged data from all other stores because the Row Level Security (RLS) policies are not properly implemented.

## Solution

To fix this issue, you need to run the SQL scripts that implement proper RLS policies for store-level data isolation.

## Steps to Fix Store Data Isolation

### 1. Run the Store Isolation Fix Script

Execute the following SQL script in your Supabase SQL Editor:

```sql
-- Run setup/fix_store_isolation.sql
```

This script will:
- Add missing `store_id` columns to tables that need them
- Implement proper RLS policies that filter data by store
- Ensure owners can only access data belonging to their store
- Allow admins to access all data

### 2. Verify the Changes

After running the script, verify that:
- Each store owner can only see their own products
- Sales data is isolated per store
- Inventory levels are separate for each store
- Financial data (transactions, budget) is store-specific

### 3. Test the Application

Log in as different store owners and verify that:
- Each owner sees only their own products in the inventory
- Sales reports show only data for their store
- Analytics dashboard displays store-specific metrics
- Financial reports are isolated per store

## How It Works

The implementation works by:

1. **Database-Level Filtering**: RLS policies ensure that database queries automatically filter results by the authenticated user's store ID.

2. **Application-Level Validation**: Backend routes verify that users can only perform operations on data belonging to their store.

3. **Proper Data Association**: All new records are automatically associated with the correct store ID based on the authenticated user.

## Troubleshooting

If you encounter issues:

1. **Check RLS Policies**: Verify that the policies were applied correctly by running:
   ```sql
   SELECT * FROM pg_policy WHERE polname LIKE '%store%';
   ```

2. **Verify Store Associations**: Ensure that users have the correct `store_id` in the users table.

3. **Test Queries**: Run sample queries to see if the filtering is working:
   ```sql
   SELECT * FROM products;
   ```

## Additional Notes

- Admin users will still be able to see all data across all stores
- The application backend has been updated to enforce store-level access control
- All new data will be properly associated with the correct store