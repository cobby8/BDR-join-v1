-- Admin Categories Table for Dynamic Settings
create table public.admin_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique, -- e.g. "일반부", "유소년"
  divisions jsonb default '[]'::jsonb, -- e.g. ["D3", "D4"]
  ages jsonb default '[]'::jsonb, -- e.g. ["U8", "U9"]
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.admin_categories enable row level security;
create policy "Authenticated users can manage categories" on public.admin_categories
  for all using (auth.role() = 'authenticated');
create policy "Public can read categories" on public.admin_categories
  for select using (true);
