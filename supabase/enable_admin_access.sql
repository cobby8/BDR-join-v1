-- 1. Enable RLS on tables (if not already enabled)
alter table public.tournaments enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;

-- 2. Allow ALL actions for Authenticated Users (which includes our 'admin' login)
-- Note: 'authenticated' role applies to any user logged in via Supabase Auth
-- Since your app has a specific Admin Login, this is the 'Normal' way to grant them access.

-- Tournaments Policies
create policy "Allow full access to tournaments for authenticated users" 
on public.tournaments
for all 
using (auth.role() = 'authenticated');

-- Teams Policies
create policy "Allow full access to teams for authenticated users" 
on public.teams
for all 
using (auth.role() = 'authenticated');

-- Players Policies
create policy "Allow full access to players for authenticated users" 
on public.players
for all 
using (auth.role() = 'authenticated');

-- 3. Ensure Storage Permissions (if needed later)
-- (Skipping for now as not part of current scope)

-- Note: The existing "Public read" policies can coexist.
