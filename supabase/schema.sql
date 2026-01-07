-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Tournaments Table
create table public.tournaments (
  id uuid primary key default uuid_generate_v4(),
  legacy_id text unique, -- Existing tourId from JSON
  name text not null,
  status text default '접수중', -- 접수중, 마감, 종료, 준비중
  start_date timestamptz,
  end_date timestamptz,
  reg_start_at timestamptz,
  reg_end_at timestamptz,
  poster_url text,
  details_url text, -- 기존 url
  
  -- Flexible JSONB columns for legacy compatibility
  divs jsonb default '{}'::jsonb, -- { "일반부": ["A", "B"], "유소년": ["..."] }
  div_caps jsonb default '{}'::jsonb, -- { "A": 16, "B": 12 } (Capacity)
  places jsonb default '[]'::jsonb, -- ["강남구민체육관", ...] or [{"name": "..."}]
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Teams Table
create table public.teams (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  
  name_ko text not null,
  name_en text,
  
  manager_name text not null,
  manager_phone text not null, -- 01012345678 (Used for lookup)
  password text, -- Edit code (optional, or use phone + code)
  
  province text,
  city text,
  
  category text, -- 종별 (일반부)
  division text, -- 디비전 (A)
  
  uniform_home text, -- Hex code
  uniform_away text, -- Hex code
  
  payment_status text default 'unpaid', -- unpaid, paid, cancelled
  status text default 'pending', -- pending, confirmed, cancelled
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Players Table
create table public.players (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references public.teams(id) on delete cascade,
  
  name text not null,
  back_number text,
  position text,
  birth_date text, -- YYMMDD string format from legacy
  is_elite boolean default false, -- 선출 여부
  
  created_at timestamptz default now()
);

-- RLS Policies (Optional but recommended)
alter table public.tournaments enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;

-- Public read access for tournaments
create policy "Public tournaments are viewable by everyone" on public.tournaments
  for select using (true);

-- Teams: Public can create, but only owners can view/edit (logic handled via application query filters usually, or strictly here)
-- For MVP/Legacy parity: Allow public read for now or unrestricted insert
create policy "Everyone can insert teams" on public.teams
  for insert with check (true);
  
create policy "Everyone can insert players" on public.players
  for insert with check (true);
