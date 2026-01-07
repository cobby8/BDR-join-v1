-- Add legacy_id column if it doesn't exist
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS legacy_id text;

-- Add unique constraint to legacy_id (required for upsert to work)
ALTER TABLE public.tournaments 
DROP CONSTRAINT IF EXISTS tournaments_legacy_id_key;

ALTER TABLE public.tournaments 
ADD CONSTRAINT tournaments_legacy_id_key UNIQUE (legacy_id);

-- Add other JSONB columns if missing (safety check)
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS divs jsonb default '{}'::jsonb,
ADD COLUMN IF NOT EXISTS div_caps jsonb default '{}'::jsonb,
ADD COLUMN IF NOT EXISTS places jsonb default '[]'::jsonb;
