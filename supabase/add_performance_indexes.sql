-- Add indexes to improve query performance for common lookups and joins

-- 1. Index on teams.manager_phone (Used for history lookup via fetchTeamDetails)
CREATE INDEX IF NOT EXISTS idx_teams_manager_phone ON public.teams(manager_phone);

-- 2. Index on teams.tournament_id (Used for listing tournament teams)
CREATE INDEX IF NOT EXISTS idx_teams_tournament_id ON public.teams(tournament_id);

-- 3. Index on players.team_id (Used for fetching team players)
CREATE INDEX IF NOT EXISTS idx_players_team_id ON public.players(team_id);

-- 4. Index on tournaments.start_date (Used for main page sorting)
CREATE INDEX IF NOT EXISTS idx_tournaments_start_date ON public.tournaments(start_date DESC);

-- 5. Index on teams.created_at (Used for sorting team lists)
CREATE INDEX IF NOT EXISTS idx_teams_created_at ON public.teams(created_at DESC);
