-- Seed Admin Categories with New Specifications
-- 1. 종별 : 일반부 / 디비전 : D3~D8
-- 2. 종별 : 유청소년 / 디비전 : 하모니, i1~i4 / 연령 : U8~U18
-- 3. 종별 : 대학부 / 디비전 : U1~U3
-- 4. 종별 : 시니어 / 디비전 : S1~S3 / 연령 : +40 ~ +70

TRUNCATE TABLE public.admin_categories;

-- 1. 일반부
INSERT INTO public.admin_categories (name, divisions, ages)
VALUES (
    '일반부',
    '["D3", "D4", "D5", "D6", "D7", "D8"]'::jsonb,
    '[]'::jsonb
);

-- 2. 유청소년
INSERT INTO public.admin_categories (name, divisions, ages)
VALUES (
    '유청소년',
    '["하모니", "i1", "i2", "i3", "i4"]'::jsonb,
    '["U8", "U9", "U10", "U11", "U12", "U13", "U14", "U15", "U16", "U17", "U18"]'::jsonb
);

-- 3. 대학부
INSERT INTO public.admin_categories (name, divisions, ages)
VALUES (
    '대학부',
    '["U1", "U2", "U3"]'::jsonb,
    '[]'::jsonb
);

-- 4. 시니어
INSERT INTO public.admin_categories (name, divisions, ages)
VALUES (
    '시니어',
    '["S1", "S2", "S3"]'::jsonb,
    '["+40", "+45", "+50", "+55", "+60", "+65", "+70"]'::jsonb
);
