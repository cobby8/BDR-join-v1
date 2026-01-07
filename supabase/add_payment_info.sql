-- Add payment info columns to tournaments table
alter table public.tournaments 
add column if not exists entry_fee text, -- e.g. "150,000" or "10만원"
add column if not exists bank_name text,
add column if not exists account_number text,
add column if not exists account_holder text;

-- Verify columns
select column_name, data_type 
from information_schema.columns 
where table_name = 'tournaments';
