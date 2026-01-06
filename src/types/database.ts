export interface Tournament {
    id: string;
    name: string;
    url?: string;
    poster_url?: string;
    poster_id?: string;
    start_date?: string;
    end_date?: string;
    reg_start_at?: string;
    reg_end_at?: string;
    edit_deadline_at?: string;
    fee_text?: string;
    account_info?: string;
    admin_code?: string;
}

export interface Division {
    id: string;
    tournament_id: string;
    category: string;
    name: string;
    max_teams?: number;
}

export interface Team {
    id: string;
    tournament_id: string;
    division_id: string;
    province?: string;
    city?: string;
    team_name_ko: string;
    team_name_en?: string;
    manager_name?: string;
    manager_phone?: string;
    uniform_home_hex?: string;
    uniform_away_hex?: string;
    edit_code?: string;
    status?: 'pending' | 'confirmed' | 'cancelled';
}

export interface Player {
    id: string;
    team_id: string;
    name: string;
    back_number: string;
    position: string;
    birth_date: string;
    is_pro: boolean;
}
