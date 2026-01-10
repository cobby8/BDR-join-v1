-- Create Brackets Table
create table public.brackets (
    id uuid not null default gen_random_uuid(),
    tournament_id uuid not null,
    category_id text, -- optional
    title text,
    type text not null default 'hybrid', -- 'single_elimination', 'round_robin', 'hybrid'
    settings jsonb default '{}'::jsonb, -- configuration (e.g. {group_count: 4, advance: 2})
    status text not null default 'draft',
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    
    constraint brackets_pkey primary key (id),
    constraint brackets_tournament_id_fkey foreign key (tournament_id) references public.tournaments (id) on delete cascade
);

-- Create Groups Table (New)
create table public.groups (
    id uuid not null default gen_random_uuid(),
    bracket_id uuid not null,
    name text not null, -- 'A조', 'B조' or 'Group A'
    order_index integer not null default 0,
    
    constraint groups_pkey primary key (id),
    constraint groups_bracket_id_fkey foreign key (bracket_id) references public.brackets (id) on delete cascade
);

-- Enable RLS for brackets/groups
alter table public.brackets enable row level security;
alter table public.groups enable row level security;

create policy "Enable read access for all users" on public.brackets for select using (true);
create policy "Enable write access for admins" on public.brackets for all using (auth.role() = 'authenticated');
create policy "Enable read access for all users" on public.groups for select using (true);
create policy "Enable write access for admins" on public.groups for all using (auth.role() = 'authenticated');

-- Create Matches Table (Updated)
create table public.matches (
    id uuid not null default gen_random_uuid(),
    bracket_id uuid not null,
    
    stage text not null default 'knockout', -- 'group', 'knockout'
    group_id uuid, -- Nullable, only for group stage matches
    
    round_number integer not null, -- Knockout: 1(Final), 2(Semis)... Group: 1(Round 1), 2(Round 2)...
    match_number integer not null,
    
    home_team_id uuid, 
    away_team_id uuid,
    
    -- Placeholders for Knockout Progression (e.g. "A1", "B2")
    home_placeholder text, 
    away_placeholder text,
    
    home_score integer default 0,
    away_score integer default 0,
    
    winner_id uuid,
    next_match_id uuid,
    
    status text not null default 'scheduled',
    start_time timestamp with time zone,
    
    created_at timestamp with time zone not null default now(),
    
    constraint matches_pkey primary key (id),
    constraint matches_bracket_id_fkey foreign key (bracket_id) references public.brackets (id) on delete cascade,
    constraint matches_group_id_fkey foreign key (group_id) references public.groups (id) on delete cascade, -- Delete matches if group deleted
    constraint matches_home_team_id_fkey foreign key (home_team_id) references public.teams (id) on delete set null,
    constraint matches_away_team_id_fkey foreign key (away_team_id) references public.teams (id) on delete set null,
    constraint matches_winner_id_fkey foreign key (winner_id) references public.teams (id) on delete set null,
    constraint matches_next_match_id_fkey foreign key (next_match_id) references public.matches (id) on delete set null
);

-- Enable RLS for matches
alter table public.matches enable row level security;
create policy "Enable read access for all users" on public.matches for select using (true);
create policy "Enable write access for admins" on public.matches for all using (auth.role() = 'authenticated');

-- Indexes
create index brackets_tournament_id_idx on public.brackets (tournament_id);
create index groups_bracket_id_idx on public.groups (bracket_id);
create index matches_bracket_id_idx on public.matches (bracket_id);
create index matches_group_id_idx on public.matches (group_id);
