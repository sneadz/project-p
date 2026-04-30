-- ============================================================
-- Activation RLS + policies grind.gg
-- ============================================================

-- Helper SECURITY DEFINER pour éviter la récursion sur league_members
CREATE OR REPLACE FUNCTION public.get_my_league_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT league_id FROM public.league_members WHERE user_id = auth.uid();
$$;

-- ============================================================
-- ENABLE RLS
-- ============================================================
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_teams    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_favorite_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_members    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- profiles
-- ============================================================
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_insert"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- ============================================================
-- registrations
-- ============================================================
CREATE POLICY "registrations_select"
  ON public.registrations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "registrations_insert"
  ON public.registrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "registrations_update"
  ON public.registrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "registrations_delete"
  ON public.registrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- bets
-- ============================================================
CREATE POLICY "bets_select"
  ON public.bets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "bets_insert"
  ON public.bets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bets_update"
  ON public.bets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bets_delete"
  ON public.bets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- favorite_teams
-- ============================================================
CREATE POLICY "favorite_teams_select"
  ON public.favorite_teams FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "favorite_teams_insert"
  ON public.favorite_teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorite_teams_update"
  ON public.favorite_teams FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorite_teams_delete"
  ON public.favorite_teams FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- global_favorite_teams
-- ============================================================
CREATE POLICY "global_favorite_teams_select"
  ON public.global_favorite_teams FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "global_favorite_teams_insert"
  ON public.global_favorite_teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "global_favorite_teams_update"
  ON public.global_favorite_teams FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "global_favorite_teams_delete"
  ON public.global_favorite_teams FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- friendships
-- ============================================================
CREATE POLICY "friendships_select"
  ON public.friendships FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "friendships_insert"
  ON public.friendships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "friendships_update"
  ON public.friendships FOR UPDATE
  TO authenticated
  USING (auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = addressee_id);

CREATE POLICY "friendships_delete"
  ON public.friendships FOR DELETE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- ============================================================
-- leagues
-- ============================================================
CREATE POLICY "leagues_select"
  ON public.leagues FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "leagues_insert"
  ON public.leagues FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "leagues_update"
  ON public.leagues FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "leagues_delete"
  ON public.leagues FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- ============================================================
-- league_members
-- Utilise get_my_league_ids() pour éviter la récursion RLS
-- ============================================================
CREATE POLICY "league_members_select"
  ON public.league_members FOR SELECT
  TO authenticated
  USING (league_id IN (SELECT public.get_my_league_ids()));

CREATE POLICY "league_members_insert"
  ON public.league_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "league_members_delete"
  ON public.league_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
