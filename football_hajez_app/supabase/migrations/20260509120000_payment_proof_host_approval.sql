-- Payment proof upload, awaiting_host_approval, host approve/reject, policy consent,
-- cancellation tier on player cancel, host review expiry, storage bucket payment-proofs.

-- ---------------------------------------------------------------------------
-- bookings: new status + columns
-- ---------------------------------------------------------------------------

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check CHECK (
    status IN ('pending', 'awaiting_host_approval', 'confirmed', 'expired', 'cancelled')
  );

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_proof_storage_path text,
  ADD COLUMN IF NOT EXISTS payment_proof_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS policy_version text,
  ADD COLUMN IF NOT EXISTS policy_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS host_review_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS host_decision_at timestamptz,
  ADD COLUMN IF NOT EXISTS host_decision_by uuid REFERENCES auth.users (id),
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS cancellation_tier text;

-- ---------------------------------------------------------------------------
-- Partial unique indexes (hold slot while pending OR awaiting OR confirmed)
-- ---------------------------------------------------------------------------

DROP INDEX IF EXISTS public.bookings_active_per_roster_slot;
DROP INDEX IF EXISTS public.bookings_one_active_per_user_per_match;

CREATE UNIQUE INDEX bookings_active_per_roster_slot ON public.bookings (roster_slot_id)
  WHERE status IN ('pending', 'awaiting_host_approval', 'confirmed');

CREATE UNIQUE INDEX bookings_one_active_per_user_per_match ON public.bookings (match_id, player_user_id)
  WHERE status IN ('pending', 'awaiting_host_approval', 'confirmed');

-- ---------------------------------------------------------------------------
-- sync_match_session_status: count awaiting as active
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
    WHERE match_id = p_match_id AND status IN ('pending', 'awaiting_host_approval', 'confirmed');

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

-- ---------------------------------------------------------------------------
-- Backfill session counts (optional consistency)
-- ---------------------------------------------------------------------------

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
        WHERE b.match_id = m2.id AND b.status IN ('pending', 'awaiting_host_approval', 'confirmed')
      ) >= 10 THEN 'full'
      ELSE 'open'
    END AS next_status
  FROM public.matches m2
) AS v
WHERE m.id = v.id AND (m.session_status IS DISTINCT FROM v.next_status);

-- ---------------------------------------------------------------------------
-- create_pending_booking: treat awaiting as active for duplicate checks + slot lock
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
      AND b.status IN ('pending', 'awaiting_host_approval', 'confirmed')
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
        AND b.status IN ('pending', 'awaiting_host_approval', 'confirmed')
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

-- ---------------------------------------------------------------------------
-- cancel_match: include awaiting_host_approval
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
    AND b.status IN ('pending', 'awaiting_host_approval', 'confirmed');
END;
$$;

-- ---------------------------------------------------------------------------
-- cancel_confirmed_booking: add deadline-based cancellation_tier
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cancel_confirmed_booking(p_booking_id uuid, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_kickoff timestamptz;
  v_tier text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT m.starts_at INTO v_kickoff
  FROM public.bookings b
  JOIN public.matches m ON m.id = b.match_id
  WHERE b.id = p_booking_id AND b.player_user_id = v_uid;

  IF NOT FOUND OR v_kickoff IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_kickoff - now() >= interval '48 hours' THEN
    v_tier := '48h_plus';
  ELSIF v_kickoff - now() >= interval '12 hours' THEN
    v_tier := '12h_to_48h';
  ELSE
    v_tier := 'under_12h';
  END IF;

  UPDATE public.bookings b
  SET
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by = auth.uid(),
    cancel_reason = p_reason,
    cancellation_tier = v_tier,
    updated_at = now()
  WHERE b.id = p_booking_id
    AND b.player_user_id = auth.uid()
    AND b.status = 'confirmed';
END;
$$;

-- ---------------------------------------------------------------------------
-- expire_awaiting_host_bookings (no auth required; definer)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_awaiting_host_bookings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n int := 0;
BEGIN
  UPDATE public.bookings b
  SET
    status = 'expired',
    updated_at = now()
  WHERE b.status = 'awaiting_host_approval'
    AND b.host_review_deadline IS NOT NULL
    AND b.host_review_deadline <= now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

-- ---------------------------------------------------------------------------
-- submit_booking_payment_proof
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_booking_payment_proof(
  p_booking_id uuid,
  p_proof_storage_path text,
  p_policy_version text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  n int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_proof_storage_path IS NULL OR length(trim(p_proof_storage_path)) < 3 THEN
    RAISE EXCEPTION 'Invalid proof path';
  END IF;

  IF p_policy_version IS NULL OR length(trim(p_policy_version)) < 1 THEN
    RAISE EXCEPTION 'Policy version required';
  END IF;

  UPDATE public.bookings b
  SET
    payment_proof_storage_path = p_proof_storage_path,
    payment_proof_uploaded_at = now(),
    policy_version = p_policy_version,
    policy_consent_at = now(),
    status = 'awaiting_host_approval',
    host_review_deadline = now() + interval '48 hours',
    updated_at = now()
  WHERE b.id = p_booking_id
    AND b.player_user_id = v_uid
    AND b.status = 'pending'
    AND b.expires_at > now();

  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN
    RAISE EXCEPTION 'Cannot submit proof for this booking';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- host_approve_booking / host_reject_booking
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.host_approve_booking(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host uuid := auth.uid();
  n int;
BEGIN
  IF v_host IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.bookings b
  SET
    status = 'confirmed',
    confirmed_at = now(),
    host_decision_at = now(),
    host_decision_by = v_host,
    updated_at = now()
  WHERE b.id = p_booking_id
    AND b.status = 'awaiting_host_approval'
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = b.match_id AND m.created_by = v_host
    );

  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN
    RAISE EXCEPTION 'Cannot approve this booking';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.host_reject_booking(p_booking_id uuid, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host uuid := auth.uid();
  n int;
BEGIN
  IF v_host IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.bookings b
  SET
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by = v_host,
    cancel_reason = coalesce(p_reason, 'Rejected by host'),
    rejection_reason = p_reason,
    host_decision_at = now(),
    host_decision_by = v_host,
    updated_at = now()
  WHERE b.id = p_booking_id
    AND b.status = 'awaiting_host_approval'
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = b.match_id AND m.created_by = v_host
    );

  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN
    RAISE EXCEPTION 'Cannot reject this booking';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.expire_awaiting_host_bookings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_booking_payment_proof(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.host_approve_booking(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.host_reject_booking(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket + policies (private)
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO UPDATE SET public = excluded.public;

DROP POLICY IF EXISTS "payment_proofs_insert_own_pending_booking" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_select_player_or_host" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_update_own_pending_booking" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_delete_own_pending_booking" ON storage.objects;

CREATE POLICY "payment_proofs_insert_own_pending_booking"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id::text = split_part(name, '/', 1)
      AND b.player_user_id = auth.uid()
      AND b.status = 'pending'
  )
);

CREATE POLICY "payment_proofs_select_player_or_host"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id::text = split_part(name, '/', 1)
        AND b.player_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.matches m ON m.id = b.match_id
      WHERE b.id::text = split_part(name, '/', 1)
        AND m.created_by = auth.uid()
    )
  )
);

CREATE POLICY "payment_proofs_update_own_pending_booking"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id::text = split_part(name, '/', 1)
      AND b.player_user_id = auth.uid()
      AND b.status = 'pending'
  )
)
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id::text = split_part(name, '/', 1)
      AND b.player_user_id = auth.uid()
      AND b.status = 'pending'
  )
);

CREATE POLICY "payment_proofs_delete_own_pending_booking"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id::text = split_part(name, '/', 1)
      AND b.player_user_id = auth.uid()
      AND b.status = 'pending'
  )
);
