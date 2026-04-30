# RLS Policies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activer Row-Level Security sur les 8 tables Supabase et créer les policies correspondantes pour bloquer tout accès non autorisé.

**Architecture:** Une seule migration SQL à appliquer dans le Supabase SQL Editor. Aucun changement de code applicatif — toutes les Server Actions utilisent déjà `createClient()` avec session utilisateur, et le cron utilise `createAdminClient()` (service role, bypass RLS automatique). Un helper SECURITY DEFINER est nécessaire pour la policy récursive de `league_members`.

**Tech Stack:** PostgreSQL RLS, Supabase SQL Editor, SQL pur

---

### Task 1 : Créer le fichier de migration SQL

**Files:**
- Create: `supabase/migrations/20260430000000_enable_rls.sql`

- [ ] **Étape 1 : Créer le répertoire et le fichier**

```bash
mkdir -p supabase/migrations
```

Créer `supabase/migrations/20260430000000_enable_rls.sql` avec ce contenu exact :

```sql
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
```

- [ ] **Étape 2 : Commit du fichier**

```bash
git add supabase/migrations/20260430000000_enable_rls.sql
git commit -m "feat: enable RLS on all tables with access policies"
```

---

### Task 2 : Appliquer la migration dans Supabase

**Files:** aucun fichier modifié — action dans le dashboard Supabase

- [ ] **Étape 1 : Ouvrir le SQL Editor**

Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard) → projet `vdkvielmqahpgyivvgnm` → **SQL Editor**

- [ ] **Étape 2 : Coller et exécuter le SQL**

Copier le contenu de `supabase/migrations/20260430000000_enable_rls.sql` et cliquer **Run**.

Résultat attendu : `Success. No rows returned` (aucune erreur).

> Si une table n'existe pas encore (ex. `friendships`, `leagues`, `league_members` selon l'état de la BDD), commenter les blocs correspondants et les appliquer une fois les tables créées.

---

### Task 3 : Vérification manuelle

**Files:** aucun

- [ ] **Test 1 — Accès non authentifié bloqué**

Dans le SQL Editor Supabase, exécuter :

```sql
-- Simule une requête anon (sans JWT)
SET LOCAL role TO anon;
SELECT * FROM public.profiles LIMIT 1;
```

Résultat attendu : `0 rows` (RLS bloque l'accès anonyme).

- [ ] **Test 2 — Leaderboard fonctionnel**

Se connecter à l'app, aller sur `/leaderboard`. Le classement doit s'afficher normalement.

- [ ] **Test 3 — Paris fonctionnels**

Sur `/series/[id]`, placer ou modifier un pari. L'opération doit réussir.

- [ ] **Test 4 — Isolation des données**

Vérifier dans le SQL Editor que la policy `bets_update` empêche de modifier les bets d'un autre user :

```sql
-- Remplacer <autre-user-id> par un vrai UUID d'un autre utilisateur
SELECT * FROM public.bets WHERE user_id = '<autre-user-id>'::uuid;
-- Doit retourner des lignes (SELECT authenticated = true)
-- Mais un UPDATE sur ces lignes depuis l'app doit échouer (policy ownership)
```

- [ ] **Test 5 — Cron non impacté**

Déclencher manuellement le cron : `GET /api/cron/score?secret=<CRON_SECRET>`.  
Le cron utilise `createAdminClient()` (service role) → bypass RLS → doit fonctionner normalement.

- [ ] **Test 6 — Alerte Supabase résolue**

Retourner dans le dashboard Supabase → **Security Advisor**. L'alerte `rls_disabled_in_public` ne doit plus apparaître pour aucune table.
