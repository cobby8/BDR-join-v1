-- Consolidated migration to add all game info columns
-- This serves as a fix for the previous partial migration and adds the new game_method column

-- Add game_time (if not exists)
alter table tournaments 
add column if not exists game_time text;
comment on column tournaments.game_time is 'Game duration and rules (e.g., 7min 4Q)';

-- Add game_ball (if not exists)
alter table tournaments 
add column if not exists game_ball text;
comment on column tournaments.game_ball is 'Official game ball (e.g., Molten BG4500)';

-- Add game_method (if not exists) - NEW
alter table tournaments 
add column if not exists game_method text;
comment on column tournaments.game_method is 'Tournament method/format (e.g., 3 teams 2 groups)';
