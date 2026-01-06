-- Tournaments Table
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    url TEXT,
    poster_url TEXT,
    poster_id TEXT,
    start_date DATE,
    end_date DATE,
    reg_start_at TIMESTAMPTZ,
    reg_end_at TIMESTAMPTZ,
    edit_deadline_at TIMESTAMPTZ,
    fee_text TEXT,
    account_info TEXT,
    admin_code TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Divisions Table (linked to tournaments)
CREATE TABLE divisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- e.g., '일반부', '대학부', 'i3'
    name TEXT NOT NULL,     -- e.g., 'D3', 'U12'
    max_teams INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams Table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    division_id UUID REFERENCES divisions(id),
    province TEXT,
    city TEXT,
    team_name_ko TEXT NOT NULL,
    team_name_en TEXT,
    manager_name TEXT,
    manager_phone TEXT,
    uniform_home_hex TEXT,
    uniform_away_hex TEXT,
    edit_code TEXT,
    status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players Table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    back_number TEXT,
    position TEXT,
    birth_date TEXT,
    is_pro BOOLEAN DEFAULT FALSE, -- 선출 여부
    created_at TIMESTAMPTZ DEFAULT NOW()
);
