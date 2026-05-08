-- Performance for "my hosted matches" list (created_by filter + starts_at ordering).
-- RLS already allows authenticated SELECT on all matches (matches_select_authenticated USING (true)).

CREATE INDEX IF NOT EXISTS matches_created_by_starts_at_desc_idx
  ON public.matches (created_by, starts_at DESC);
