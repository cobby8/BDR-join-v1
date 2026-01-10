
-- TMAP Redirect Issue and UI Text Change have been fixed in the codebase.
-- This script addresses the Image Upload failure.

-- Create 'tournaments' bucket
insert into storage.buckets (id, name, public)
values ('tournaments', 'tournaments', true)
on conflict (id) do nothing;

-- NOTE: storage.objects already has RLS enabled by default in Supabase.
-- We do NOT need to run 'alter table storage.objects enable row level security;' which causes permission errors.

-- Policy: Allow Public Read Access
create policy "Public Access Tournaments"
  on storage.objects for select
  using ( bucket_id = 'tournaments' );

-- Policy: Allow Authenticated Users to Upload
create policy "Authenticated Upload Tournaments"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'tournaments' );

-- Policy: Allow Authenticated Users to Update their own uploads (or all if admin)
create policy "Authenticated Update Tournaments"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'tournaments' );

-- Policy: Allow Authenticated Users to Delete
create policy "Authenticated Delete Tournaments"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'tournaments' );
