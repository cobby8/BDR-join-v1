-- 1. Modify teams table to unlink from tournament deletion
ALTER TABLE public.teams
DROP CONSTRAINT IF EXISTS teams_tournament_id_fkey;

ALTER TABLE public.teams
ALTER COLUMN tournament_id DROP NOT NULL;

ALTER TABLE public.teams
ADD CONSTRAINT teams_tournament_id_fkey
FOREIGN KEY (tournament_id)
REFERENCES public.tournaments(id)
ON DELETE SET NULL;

-- 2. Restore 'Bichim' Team
-- Need a valid tournament_id? Or insert with NULL?
-- User said "Recently deleted tournament". So the tournament is gone.
-- We should insert it with NULL tournament_id, or restore the tournament too?
-- For now, insert with NULL tournament_id to at least have the team data.
-- If user wants to re-link, they can do so later (or we need to restore tournament).
-- Let's try to find a valid tournament or just leave it NULL.
-- Data from screenshot:
-- Name: 비침 (bichim)
-- Manager: 김수빈 (01091678117)
-- Region: 서울특별시 강동구
-- Uniform: Home(#f966d2), Away(#000000)
-- Category: 일반부 / D7 (This was likely from the deleted tournament)

INSERT INTO public.teams (
    name_ko, name_en, manager_name, manager_phone,
    province, city, category, division,
    uniform_home, uniform_away,
    payment_status, status,
    tournament_id
) VALUES (
    '비침', 'bichim', '김수빈', '01091678117',
    '서울특별시', '강동구', '일반부', 'D7',
    '#f966d2', '#000000',
    'pending', 'pending',
    NULL
);

-- Note: Players for Bichim need to be restored too? 
-- Screenshot showed "5 players". But I don't have their details.
-- I can only restore the Team entity for now.
