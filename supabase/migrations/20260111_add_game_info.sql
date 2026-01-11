-- Add game info columns to tournaments table
alter table tournaments 
add column if not exists game_time text,
add column if not exists game_ball text;

-- Add comments
comment on column tournaments.game_time is 'Game duration and rules (e.g. 7min 4Q)';
comment on column tournaments.game_ball is 'Official game ball (e.g. Molten BG4500)';
