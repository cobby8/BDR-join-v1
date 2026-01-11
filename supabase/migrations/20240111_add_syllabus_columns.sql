-- Add detailed info columns to tournaments table
alter table tournaments 
add column if not exists awards text,
add column if not exists sponsors text,
add column if not exists organizer text,
add column if not exists host text;

-- Add comments for clarity
comment on column tournaments.awards is 'Detailed text about awards/prizes';
comment on column tournaments.sponsors is 'List of sponsors';
comment on column tournaments.organizer is 'Event organizer (주최)';
comment on column tournaments.host is 'Event host (주관)';
