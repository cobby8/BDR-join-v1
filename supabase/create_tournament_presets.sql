-- Create tournament_presets table
create table if not exists tournament_presets (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  data jsonb not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table tournament_presets enable row level security;

-- Policies (Allow all for now, or restrict to admin authenticated users later)
-- Assuming public access for authenticated users or just admin
create policy "Enable all access for authenticated users" on tournament_presets
  for all using (auth.role() = 'authenticated');
