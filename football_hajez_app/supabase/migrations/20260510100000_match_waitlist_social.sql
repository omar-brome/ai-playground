-- Waitlist for full roster roles + RPCs for join/leave/queue introspection

CREATE TABLE public.match_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  player_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  team_side text NOT NULL CHECK (team_side IN ('team1', 'team2')),
  position text NOT NULL CHECK (position IN ('goalkeeper', 'midfielder', 'attacker')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, player_user_id, team_side, position)
);

CREATE INDEX match_waitlist_match_team_pos_idx ON public.match_waitlist (match_id, team_side, position, created_at);

ALTER TABLE public.match_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY match_waitlist_select_own ON public.match_waitlist FOR SELECT TO authenticated
  USING (player_user_id = auth.uid());

CREATE POLICY match_waitlist_select_host ON public.match_waitlist FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND m.created_by = auth.uid())
  );

GRANT SELECT ON public.match_waitlist TO authenticated;

-- ---------------------------------------------------------------------------
-- Helpers: role "full" = every roster slot for (match, team, position) has an active booking
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.role_fully_booked(p_match_id uuid, p_team_side text, p_position text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    COALESCE(
      (
        SELECT COUNT(*)::int
        FROM public.match_roster_slots rs
        WHERE rs.match_id = p_match_id
          AND rs.team_side = p_team_side
          AND rs.position = p_position
      ),
      0
    ) > 0
    AND (
      SELECT COUNT(*)::int
      FROM public.match_roster_slots rs
      WHERE rs.match_id = p_match_id
        AND rs.team_side = p_team_side
        AND rs.position = p_position
        AND EXISTS (
          SELECT 1
          FROM public.bookings b
          WHERE b.roster_slot_id = rs.id
            AND b.status IN ('pending', 'awaiting_host_approval', 'confirmed')
        )
    ) = (
      SELECT COUNT(*)::int
      FROM public.match_roster_slots rs
      WHERE rs.match_id = p_match_id
        AND rs.team_side = p_team_side
        AND rs.position = p_position
    );
$$;

CREATE OR REPLACE FUNCTION public.join_match_waitlist(
  p_match_id uuid,
  p_team_side text,
  p_position text
)
RETURNS TABLE (waitlist_id uuid, queue_position integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_wid uuid;
  v_pos int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_team_side NOT IN ('team1', 'team2') OR p_position NOT IN ('goalkeeper', 'midfielder', 'attacker') THEN
    RAISE EXCEPTION 'Invalid team or position';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.matches m
    WHERE m.id = p_match_id
      AND m.status = 'scheduled'
      AND m.ends_at >= now()
      AND m.session_status IN ('open', 'full')
  ) THEN
    RAISE EXCEPTION 'Match not accepting waitlist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.match_id = p_match_id
      AND b.player_user_id = v_uid
      AND b.status IN ('pending', 'awaiting_host_approval', 'confirmed')
  ) THEN
    RAISE EXCEPTION 'Already have a booking for this match';
  END IF;

  IF NOT public.role_fully_booked(p_match_id, p_team_side, p_position) THEN
    RAISE EXCEPTION 'Role is not full';
  END IF;

  INSERT INTO public.match_waitlist (match_id, player_user_id, team_side, position)
  VALUES (p_match_id, v_uid, p_team_side, p_position)
  ON CONFLICT (match_id, player_user_id, team_side, position) DO NOTHING;

  SELECT w.id INTO v_wid
  FROM public.match_waitlist w
  WHERE w.match_id = p_match_id
    AND w.player_user_id = v_uid
    AND w.team_side = p_team_side
    AND w.position = p_position;

  SELECT COUNT(*)::int INTO v_pos
  FROM public.match_waitlist w2
  WHERE w2.match_id = p_match_id
    AND w2.team_side = p_team_side
    AND w2.position = p_position
    AND w2.created_at <= (SELECT w3.created_at FROM public.match_waitlist w3 WHERE w3.id = v_wid);

  RETURN QUERY SELECT v_wid, v_pos;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_match_waitlist(
  p_match_id uuid,
  p_team_side text,
  p_position text
)
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

  DELETE FROM public.match_waitlist w
  WHERE w.match_id = p_match_id
    AND w.player_user_id = v_uid
    AND w.team_side = p_team_side
    AND w.position = p_position;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_waitlist_entries(p_match_id uuid)
RETURNS TABLE (team_side text, role text, queue_position integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    w.team_side,
    w.position AS role,
    (
      SELECT COUNT(*)::int
      FROM public.match_waitlist w2
      WHERE w2.match_id = w.match_id
        AND w2.team_side = w.team_side
        AND w2.position = w.position
        AND w2.created_at <= w.created_at
    ) AS queue_position
  FROM public.match_waitlist w
  WHERE w.match_id = p_match_id
    AND w.player_user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.join_match_waitlist(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_match_waitlist(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_waitlist_entries(uuid) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.match_waitlist;
