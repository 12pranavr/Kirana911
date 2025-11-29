-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS Table
create table users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  role text check (role in ('owner', 'staff')) not null,
  created_at timestamp with time zone default now()
);

-- 2. PRODUCTS Table
create table products (
  id uuid primary key default uuid_generate_v4(),
  sku_id text unique not null,
  name text not null,
  category text,
  cost_price float not null,
  selling_price float not null,
  reorder_point int default 10,
  supplier_info text,
  image_url text,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- 3. STOCK_LEVELS Table
create table stock_levels (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  current_stock int default 0,
  updated_at timestamp with time zone default now()
);

-- 4. SALES Table
create table sales (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id),
  date timestamp with time zone default now(),
  qty_sold int not null,
  unit_price float not null,
  total_price float not null,
  source text check (source in ('ocr', 'manual', 'online')) default 'manual'
);

-- 5. TRANSACTIONS Table
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  date timestamp with time zone default now(),
  type text check (type in ('income', 'expense', 'sale', 'refund')),
  category text,
  amount float not null,
  note text,
  related_product_id uuid references products(id),
  added_by uuid references users(id)
);

-- 6. BUDGET Table
create table budget (
  id uuid primary key default uuid_generate_v4(),
  month text not null, -- Format: 'YYYY-MM'
  income_target float,
  expense_limit float,
  category_limits jsonb,
  created_by uuid references users(id)
);

-- 7. CHAT_LOGS Table
create table chat_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  store_id uuid references stores(id),
  message text,
  response text,
  timestamp timestamp with time zone default now()
);

-- 8. AUDIT_LOGS Table
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  action text not null,
  table_name text,
  details jsonb,
  timestamp timestamp with time zone default now()
);

-- RLS Policies (Basic for now - allow all for authenticated, or public for prototype simplicity)
alter table users enable row level security;
alter table products enable row level security;
alter table stock_levels enable row level security;
alter table sales enable row level security;
alter table transactions enable row level security;
alter table budget enable row level security;
alter table chat_logs enable row level security;
alter table audit_logs enable row level security;

-- For prototype, we might want to allow public access or just authenticated
create policy "Enable read access for all users" on products for select using (true);
create policy "Enable insert for all users" on products for insert with check (true);
create policy "Enable update for all users" on products for update using (true);
-- (Repeat for other tables if needed, or keep it strict)