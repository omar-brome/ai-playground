-- Malaab: venues, matches, roster slots, bookings + RLS + transactional RPCs
-- Run via Supabase CLI: supabase db push

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text,
  phone_e164 text,
  default_role text CHECK (default_role IN ('player', 'pitch_host')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.venues (
  id text PRIMARY KEY,
  name text NOT NULL,
  location text NOT NULL,
  image text,
  map_url text,
  surface text,
  parking text,
  amenities text[] NOT NULL DEFAULT '{}',
  about text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id text NOT NULL REFERENCES public.venues (id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  type text NOT NULL DEFAULT '5-a-side',
  price_lbp integer NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  created_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES auth.users (id),
  cancel_reason text
);

CREATE INDEX matches_venue_starts_idx ON public.matches (venue_id, starts_at);
CREATE INDEX matches_created_by_idx ON public.matches (created_by);

CREATE TABLE public.match_roster_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  team_side text NOT NULL CHECK (team_side IN ('team1', 'team2')),
  position text NOT NULL CHECK (position IN ('goalkeeper', 'midfielder', 'attacker')),
  slot_ordinal smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, team_side, position, slot_ordinal)
);

CREATE INDEX match_roster_slots_match_idx ON public.match_roster_slots (match_id);

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  roster_slot_id uuid NOT NULL REFERENCES public.match_roster_slots (id) ON DELETE CASCADE,
  player_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  player_name text NOT NULL,
  phone_e164 text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'expired', 'cancelled')),
  amount_lbp integer NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  cancelled_by uuid REFERENCES auth.users (id)
);

CREATE UNIQUE INDEX bookings_active_per_roster_slot ON public.bookings (roster_slot_id)
  WHERE status IN ('pending', 'confirmed');

CREATE UNIQUE INDEX bookings_one_active_per_user_per_match ON public.bookings (match_id, player_user_id)
  WHERE status IN ('pending', 'confirmed');

CREATE INDEX bookings_match_idx ON public.bookings (match_id);
CREATE INDEX bookings_player_idx ON public.bookings (player_user_id);

-- ---------------------------------------------------------------------------
-- New user → profile
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RPC: host match + roster slots
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_host_match(
  p_venue_id text,
  p_starts_at timestamptz,
  p_duration_minutes integer DEFAULT 90,
  p_price_lbp integer DEFAULT 300000,
  p_match_type text DEFAULT '5-a-side'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_ends timestamptz;
  v_match_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.venues v WHERE v.id = p_venue_id) THEN
    RAISE EXCEPTION 'Unknown venue';
  END IF;

  v_ends := p_starts_at + make_interval(mins => p_duration_minutes);

  IF EXISTS (
    SELECT 1
    FROM public.matches m
    WHERE m.venue_id = p_venue_id
      AND m.status = 'scheduled'
      AND m.starts_at < v_ends
      AND m.ends_at > p_starts_at
  ) THEN
    RAISE EXCEPTION 'Venue overlap';
  END IF;

  INSERT INTO public.matches (venue_id, starts_at, ends_at, type, price_lbp, created_by)
  VALUES (p_venue_id, p_starts_at, v_ends, p_match_type, p_price_lbp, v_uid)
  RETURNING id INTO v_match_id;

  INSERT INTO public.match_roster_slots (match_id, team_side, position, slot_ordinal)
  SELECT v_match_id, 'team1', v.position, v.ord
  FROM (
    VALUES
      ('goalkeeper'::text, 0::smallint),
      ('midfielder', 0),
      ('midfielder', 1),
      ('attacker', 0),
      ('attacker', 1)
  ) AS v(position, ord);

  INSERT INTO public.match_roster_slots (match_id, team_side, position, slot_ordinal)
  SELECT v_match_id, 'team2', v.position, v.ord
  FROM (
    VALUES
      ('goalkeeper'::text, 0::smallint),
      ('midfielder', 0),
      ('midfielder', 1),
      ('attacker', 0),
      ('attacker', 1)
  ) AS v(position, ord);

  RETURN v_match_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: pending booking (locks slot row)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_pending_booking(
  p_match_id uuid,
  p_team_side text,
  p_position text,
  p_player_name text,
  p_phone_e164 text,
  p_amount_lbp integer,
  p_hold_minutes integer DEFAULT 15
)
RETURNS TABLE (booking_id uuid, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_slot_id uuid;
  v_expires timestamptz := now() + make_interval(mins => p_hold_minutes);
  v_bid uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_team_side NOT IN ('team1', 'team2') OR p_position NOT IN ('goalkeeper', 'midfielder', 'attacker') THEN
    RAISE EXCEPTION 'Invalid team or position';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.matches m WHERE m.id = p_match_id AND m.status = 'scheduled') THEN
    RAISE EXCEPTION 'Match not available';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.match_id = p_match_id
      AND b.player_user_id = v_uid
      AND b.status IN ('pending', 'confirmed')
  ) THEN
    RAISE EXCEPTION 'Already have a booking for this match';
  END IF;

  SELECT rs.id INTO v_slot_id
  FROM public.match_roster_slots rs
  WHERE rs.match_id = p_match_id
    AND rs.team_side = p_team_side
    AND rs.position = p_position
    AND NOT EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.roster_slot_id = rs.id
        AND b.status IN ('pending', 'confirmed')
    )
  ORDER BY rs.slot_ordinal
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF v_slot_id IS NULL THEN
    RAISE EXCEPTION 'No slot available for this role';
  END IF;

  INSERT INTO public.bookings (
    match_id, roster_slot_id, player_user_id, player_name, phone_e164, status, amount_lbp, expires_at
  )
  VALUES (p_match_id, v_slot_id, v_uid, p_player_name, p_phone_e164, 'pending', p_amount_lbp, v_expires)
  RETURNING id INTO v_bid;

  RETURN QUERY SELECT v_bid, v_expires;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_booking_demo(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.bookings b
  SET
    status = 'confirmed',
    confirmed_at = now(),
    updated_at = now()
  WHERE b.id = p_booking_id
    AND b.player_user_id = auth.uid()
    AND b.status = 'pending';
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_pending_booking(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.bookings b
  SET status = 'expired', updated_at = now()
  WHERE b.id = p_booking_id
    AND b.player_user_id = auth.uid()
    AND b.status = 'pending'
    AND b.expires_at <= now();
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_confirmed_booking(p_booking_id uuid, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.bookings b
  SET
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by = auth.uid(),
    cancel_reason = p_reason,
    updated_at = now()
  WHERE b.id = p_booking_id
    AND b.player_user_id = auth.uid()
    AND b.status = 'confirmed';
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_match(p_match_id uuid, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.matches m WHERE m.id = p_match_id AND m.created_by = v_uid) THEN
    RAISE EXCEPTION 'Not host of this match';
  END IF;

  UPDATE public.matches m
  SET
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by = v_uid,
    cancel_reason = p_reason,
    updated_at = now()
  WHERE m.id = p_match_id;

  UPDATE public.bookings b
  SET
    status = 'cancelled',
    cancelled_at = coalesce(b.cancelled_at, now()),
    cancelled_by = v_uid,
    cancel_reason = coalesce(b.cancel_reason, p_reason),
    updated_at = now()
  WHERE b.match_id = p_match_id
    AND b.status IN ('pending', 'confirmed');
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_roster_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY venues_select_all ON public.venues FOR SELECT USING (true);

CREATE POLICY matches_select_scheduled_anon ON public.matches FOR SELECT TO anon USING (status = 'scheduled');
CREATE POLICY matches_select_authenticated ON public.matches FOR SELECT TO authenticated USING (true);

CREATE POLICY roster_select_anon ON public.match_roster_slots FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND m.status = 'scheduled'));
CREATE POLICY roster_select_auth ON public.match_roster_slots FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id));

CREATE POLICY bookings_select_roster_anon ON public.bookings FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND m.status = 'scheduled'));
CREATE POLICY bookings_select_player ON public.bookings FOR SELECT TO authenticated USING (player_user_id = auth.uid());
CREATE POLICY bookings_select_host ON public.bookings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND m.created_by = auth.uid()));
CREATE POLICY bookings_select_scheduled_match ON public.bookings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND m.status = 'scheduled'));

-- ---------------------------------------------------------------------------
-- Grants (direct table writes go through RPC / service role)
-- ---------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.venues TO anon, authenticated;
GRANT SELECT ON public.matches TO anon, authenticated;
GRANT SELECT ON public.match_roster_slots TO anon, authenticated;
GRANT SELECT ON public.bookings TO anon, authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

GRANT EXECUTE ON FUNCTION public.create_host_match(text, timestamptz, integer, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_pending_booking(uuid, text, text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_booking_demo(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_pending_booking(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_confirmed_booking(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_match(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Seed venues (ids align with src/data/mockData.ts)
-- ---------------------------------------------------------------------------

INSERT INTO public.venues (id, name, location, image, map_url, surface, parking, amenities, about)
VALUES
  (
    '4b',
    '4B',
    'Saida',
    '/venues/4b.png',
    'https://maps.app.goo.gl/Ugf6Eh4RYSkwEHN29',
    'Outdoor',
    'Street',
    ARRAY['Changing rooms', 'Night lights', 'Water station']::text[],
    'Competitive mini-football venue in Saida with evening games and active local squads.'
  ),
  (
    'streetball',
    'Streetball',
    'Saida',
    '/venues/streetball.png',
    'https://maps.app.goo.gl/eZKJbREvSoNQBuRw6',
    'Indoor',
    'Street',
    ARRAY['Snack kiosk', 'Lockers', 'Restrooms']::text[],
    'Fast-paced 5v5 hub in Saida, ideal for late-night sessions.'
  ),
  (
    'upland',
    'Upland',
    'Saida',
    '/venues/upland.png',
    'https://maps.app.goo.gl/cyemhXa38TXLad2dA',
    'Outdoor',
    'Available',
    ARRAY['Spectator seats', 'Cafeteria', 'Warm-up area']::text[],
    'Saida venue with spacious sideline areas and clean turf.'
  ),
  (
    'ace',
    'Ace Arena',
    'Saida',
    '/venues/ace.png',
    'https://maps.app.goo.gl/hvTuHSiCdpUZkHEV7',
    'Indoor',
    'Available',
    ARRAY['Showers', 'Equipment shop', 'Referee desk']::text[],
    'Well-organized Saida arena with premium lighting and smooth booking flow.'
  )
ON CONFLICT (id) DO NOTHING;
