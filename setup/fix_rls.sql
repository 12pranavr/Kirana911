-- Fix RLS Policies for Inventory Management

-- 1. Fix Stock Levels Policies
-- Enable RLS (already enabled, but good to be safe)
alter table stock_levels enable row level security;

-- Create policies for stock_levels
create policy "Enable read access for all users" on stock_levels for select using (true);
create policy "Enable insert for all users" on stock_levels for insert with check (true);
create policy "Enable update for all users" on stock_levels for update using (true);
create policy "Enable delete for all users" on stock_levels for delete using (true);

-- 2. Ensure Products Policies are complete
create policy "Enable delete for all users" on products for delete using (true);

-- 3. Ensure Audit Logs Policies
create policy "Enable insert for all users" on audit_logs for insert with check (true);
create policy "Enable read access for all users" on audit_logs for select using (true);

-- 4. Ensure Sales/Transactions Policies
create policy "Enable read access for all users" on sales for select using (true);
create policy "Enable insert for all users" on sales for insert with check (true);

create policy "Enable read access for all users" on transactions for select using (true);
create policy "Enable insert for all users" on transactions for insert with check (true);
