-- Demo: many upcoming matches hosted by omar.brome@gmail.com across all seeded venues.
--
-- Run in Supabase Dashboard → SQL Editor (or `psql` as a role that can read auth.users
-- and insert into public.matches).
--
-- Prerequisites:
--   1. User omar.brome@gmail.com must already exist in auth.users (sign up once, even if
--      you never complete email — or create the user in Authentication → Users).
--   2. Venues must be seeded (migration 20250508120000_malaab_schema_rls_rpc.sql): 4b, streetball, upland, ace.
--
-- Re-running inserts additional rows (no idempotency). To clear demo rows first:
--   DELETE FROM public.match_roster_slots WHERE match_id IN (
--     SELECT id FROM public.matches WHERE created_by = (SELECT id FROM auth.users WHERE email = 'omar.brome@gmail.com')
--   );
--   DELETE FROM public.matches WHERE created_by = (SELECT id FROM auth.users WHERE email = 'omar.brome@gmail.com');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'omar.brome@gmail.com') THEN
    RAISE EXCEPTION 'No auth user for omar.brome@gmail.com — create the account in Supabase Auth first.';
  END IF;
END $$;

UPDATE public.profiles
SET default_role = 'pitch_host', updated_at = now()
WHERE id = (SELECT id FROM auth.users WHERE email = 'omar.brome@gmail.com' LIMIT 1);

WITH host AS (
  SELECT id FROM auth.users WHERE email = 'omar.brome@gmail.com' LIMIT 1
),
planned AS (
  SELECT
    v.venue_id,
    now() + ((g.n * 2 - 1) || ' days')::interval + ((10 + v.v_ord * 3) || ' hours')::interval AS starts_at,
    h.id AS created_by
  FROM host h
  CROSS JOIN (
    VALUES
      ('4b'::text, 0),
      ('streetball', 1),
      ('upland', 2),
      ('ace', 3)
  ) AS v(venue_id, v_ord)
  CROSS JOIN generate_series(1, 12) AS g(n)
),
ins AS (
  INSERT INTO public.matches (venue_id, starts_at, ends_at, type, price_lbp, created_by, session_status, status)
  SELECT
    p.venue_id,
    p.starts_at,
    p.starts_at + interval '90 minutes',
    '5-a-side',
    300000,
    p.created_by,
    'open',
    'scheduled'
  FROM planned p
  RETURNING id
)
INSERT INTO public.match_roster_slots (match_id, team_side, position, slot_ordinal)
SELECT i.id, s.team_side, s.position, s.slot_ordinal
FROM ins i
CROSS JOIN (
  VALUES
    ('team1'::text, 'goalkeeper'::text, 0::smallint),
    ('team1', 'midfielder', 0::smallint),
    ('team1', 'midfielder', 1::smallint),
    ('team1', 'attacker', 0::smallint),
    ('team1', 'attacker', 1::smallint),
    ('team2', 'goalkeeper', 0::smallint),
    ('team2', 'midfielder', 0::smallint),
    ('team2', 'midfielder', 1::smallint),
    ('team2', 'attacker', 0::smallint),
    ('team2', 'attacker', 1::smallint)
) AS s(team_side, position, slot_ordinal);

-- 12 matches × 4 venues = 48 upcoming rows (+ roster slots)
