-- Add gender column to tournaments table
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS gender text DEFAULT 'mixed';

-- Update comment
COMMENT ON COLUMN public.tournaments.gender IS 'Category Gender: mixed, male, female';
