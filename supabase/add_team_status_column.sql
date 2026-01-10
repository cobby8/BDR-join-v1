-- Add status column to teams table
ALTER TABLE public.teams
ADD COLUMN IF NOT EXISTS status text DEFAULT 'APPLIED';

-- Update comment
COMMENT ON COLUMN public.teams.status IS 'Registration Status: APPLIED, WAITING, CANCELED, CONFIRMED';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_teams_status ON public.teams(status);
