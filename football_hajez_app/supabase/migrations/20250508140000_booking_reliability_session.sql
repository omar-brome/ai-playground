-- Booking reliability: match row lock in create_pending_booking, seat conflict handling,
-- session_status (open/full/cancelled/finished), Beirut wall clock for create_host_match,
-- RLS aligned with session_status for public roster reads.

-- Replace single overload (avoid two signatures after adding defaulted args)
DROP FUNCTION IF EXISTS public.create_host_match(text, timestamptz, integer, integer, text);

-- ---------------------------------------------------------------------------
-- matches.session_status
-- ---------------------------------------------------------------------------

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS session_status text;

UPDATE public.matches
SET session_status = 'open'
WHERE session_status IS NULL;

-- Backfill from current rows (idempotent for already-set rows)
UPDATE public.matches m
SET session_status = v.next_status
FROM (
  SELECT
    m2.id,
    CASE
      WHEN m2.status = 'cancelled' THEN 'cancelled'
      WHEN m2.ends_at < now() AND m2.status = 'scheduled' THEN 'finished'
      WHEN (
        SELECT COUNT(*)::int
        FROM public.bookings b
        WHERE b.match_id = m2.id AND b.status IN ('pending', 'confirmed')
      ) >= 10 THEN 'full'
      ELSE 'open'
    END AS next_status
  FROM public.matches m2
) AS v
WHERE m.id = v.id AND (m.session_status IS DISTINCT FROM v.next_status);

ALTER TABLE public.matches
  ALTER COLUMN session_status SET DEFAULT 'open',
  ALTER COLUMN session_status SET NOT NULL;

ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_session_status_check;
ALTER TABLE public.matches
  ADD CONSTRAINT matches_session_status_check CHECK (
    session_status IN ('open', 'full', 'cancelled', 'finished')
  );

-- ---------------------------------------------------------------------------
-- Recompute session_status (SECURITY DEFINER: trigger updates matches under RLS)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_match_session_status(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m_status text;
  m_ends timestamptz;
  active_count int;
  next_sess text;
BEGIN
  SELECT status, ends_at INTO m_status, m_ends
  FROM public.matches
  WHERE id = p_match_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF m_status = 'cancelled' THEN
    next_sess := 'cancelled';
  ELSIF m_ends < now() AND m_status = 'scheduled' THEN
    next_sess := 'finished';
  ELSE
    SELECT COUNT(*)::int INTO active_count
    FROM public.bookings
    WHERE match_id = p_match_id AND status IN ('pending', 'confirmed');

    IF active_count >= 10 THEN
      next_sess := 'full';
    ELSE
      next_sess := 'open';
    END IF;
  END IF;

  UPDATE public.matches
  SET session_status = next_sess, updated_at = now()
  WHERE id = p_match_id AND session_status IS DISTINCT FROM next_sess;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_bookings_sync_match_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mid uuid;
BEGIN
  IF tg_op = 'DELETE' THEN
    mid := old.match_id;
  ELSE
    mid := new.match_id;
  END IF;
  PERFORM public.sync_match_session_status(mid);
  IF tg_op = 'DELETE' THEN
    RETURN old;
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_bookings_sync_match_session ON public.bookings;
CREATE TRIGGER trg_bookings_sync_match_session
  AFTER INSERT OR UPDATE OF status OR DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_bookings_sync_match_session();

-- ---------------------------------------------------------------------------
-- create_host_match: optional Beirut wall date+time OR p_starts_at timestamptz
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_host_match(
  p_venue_id text,
  p_starts_at timestamptz DEFAULT NULL,
  p_duration_minutes integer DEFAULT 90,
  p_price_lbp integer DEFAULT 300000,
  p_match_type text DEFAULT '5-a-side',
  p_start_date date DEFAULT NULL,
  p_start_time time without time zone DEFAULT NULL,
  p_tz text DEFAULT 'Asia/Beirut'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_starts timestamptz;
  v_ends timestamptz;
  v_match_id uuid;
  v_tz text := coalesce(nullif(trim(p_tz), ''), 'Asia/Beirut');
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_start_date IS NOT NULL AND p_start_time IS NOT NULL THEN
    IF p_starts_at IS NOT NULL THEN
      RAISE EXCEPTION 'Provide either p_starts_at or p_start_date and p_start_time, not both';
    END IF;
    v_starts := (p_start_date::timestamp + p_start_time) AT TIME ZONE v_tz;
  ELSIF p_starts_at IS NOT NULL THEN
    v_starts := p_starts_at;
  ELSE
    RAISE EXCEPTION 'Provide p_starts_at or p_start_date and p_start_time';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.venues v WHERE v.id = p_venue_id) THEN
    RAISE EXCEPTION 'Unknown venue';
  END IF;

  v_ends := v_starts + make_interval(mins => p_duration_minutes);

  IF EXISTS (
    SELECT 1
    FROM public.matches m
    WHERE m.venue_id = p_venue_id
      AND m.status = 'scheduled'
      AND m.ends_at > now()
      AND m.starts_at < v_ends
      AND m.ends_at > v_starts
  ) THEN
    RAISE EXCEPTION 'Venue overlap';
  END IF;

  INSERT INTO public.matches (venue_id, starts_at, ends_at, type, price_lbp, created_by, session_status)
  VALUES (p_venue_id, v_starts, v_ends, p_match_type, p_price_lbp, v_uid, 'open')
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
-- create_pending_booking: lock match row, return roster_slot_id, handle unique violation
-- ---------------------------------------------------------------------------
-- Postgres cannot change RETURNS TABLE column set via CREATE OR REPLACE; drop first.
DROP FUNCTION IF EXISTS public.create_pending_booking(uuid, text, text, text, text, integer, integer);

CREATE OR REPLACE FUNCTION public.create_pending_booking(
  p_match_id uuid,
  p_team_side text,
  p_position text,
  p_player_name text,
  p_phone_e164 text,
  p_amount_lbp integer,
  p_hold_minutes integer DEFAULT 15
)
RETURNS TABLE (booking_id uuid, expires_at timestamptz, roster_slot_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_slot_id uuid;
  v_expires timestamptz := now() + make_interval(mins => p_hold_minutes);
  v_bid uuid;
  v_sess text;
  v_stat text;
  v_ends timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_team_side NOT IN ('team1', 'team2') OR p_position NOT IN ('goalkeeper', 'midfielder', 'attacker') THEN
    RAISE EXCEPTION 'Invalid team or position';
  END IF;

  SELECT m.session_status, m.status, m.ends_at
  INTO v_sess, v_stat, v_ends
  FROM public.matches m
  WHERE m.id = p_match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF v_stat <> 'scheduled' OR v_sess NOT IN ('open', 'full') OR v_ends <= now() THEN
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

  BEGIN
    INSERT INTO public.bookings (
      match_id, roster_slot_id, player_user_id, player_name, phone_e164, status, amount_lbp, expires_at
    )
    VALUES (p_match_id, v_slot_id, v_uid, p_player_name, p_phone_e164, 'pending', p_amount_lbp, v_expires)
    RETURNING id INTO v_bid;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'Seat no longer available';
  END;

  RETURN QUERY SELECT v_bid, v_expires, v_slot_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_pending_booking(uuid, text, text, text, text, integer, integer) TO authenticated;

-- ---------------------------------------------------------------------------
-- cancel_match: set session_status cancelled
-- ---------------------------------------------------------------------------

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
    session_status = 'cancelled',
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
-- RLS: public roster for scheduled matches in open or full session
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS matches_select_scheduled_anon ON public.matches;
CREATE POLICY matches_select_scheduled_anon ON public.matches FOR SELECT TO anon
  USING (status = 'scheduled' AND session_status IN ('open', 'full'));

DROP POLICY IF EXISTS roster_select_anon ON public.match_roster_slots;
CREATE POLICY roster_select_anon ON public.match_roster_slots FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id AND m.status = 'scheduled' AND m.session_status IN ('open', 'full')
  ));

DROP POLICY IF EXISTS bookings_select_roster_anon ON public.bookings;
CREATE POLICY bookings_select_roster_anon ON public.bookings FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id AND m.status = 'scheduled' AND m.session_status IN ('open', 'full')
  ));

DROP POLICY IF EXISTS bookings_select_scheduled_match ON public.bookings;
CREATE POLICY bookings_select_scheduled_match ON public.bookings FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id AND m.status = 'scheduled' AND m.session_status IN ('open', 'full')
  ));

-- ---------------------------------------------------------------------------
-- Grants (signature changed for create_host_match)
-- ---------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.create_host_match(
  text, timestamptz, integer, integer, text, date, time without time zone, text
) TO authenticated;
