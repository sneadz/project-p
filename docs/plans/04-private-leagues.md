# Plan 04 — Ligues privées

## Objectif

Permettre à un utilisateur de créer une ligue privée sur une compétition, d'inviter ses amis, et de voir un leaderboard privé entre eux.

## Approche retenue

Une ligue est liée à une série spécifique. Elle a un code d'invitation unique. Les membres voient un leaderboard privé dans la page de la série.

## Schéma BDD

### Nouvelle table `leagues`

```sql
create table leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  serie_id int not null,
  owner_id uuid references profiles(id) on delete cascade,
  invite_code text unique not null default substr(md5(random()::text), 1, 8),
  created_at timestamp default now()
);
```

### Nouvelle table `league_members`

```sql
create table league_members (
  league_id uuid references leagues(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamp default now(),
  primary key (league_id, user_id)
);
```

## Étapes d'implémentation

### 1. Créer les tables en Supabase

Appliquer les migrations SQL ci-dessus.

### 2. Server Actions

Fichier : `src/app/actions/leagues.ts`

- `createLeague(name, serieId)` — crée la ligue + ajoute le créateur comme membre
- `joinLeague(inviteCode)` — rejoindre via code (vérifie que l'user est inscrit à la série)
- `leaveLeague(leagueId)` — quitter la ligue

### 3. UI — Créer / rejoindre une ligue

Dans la page série `/series/[id]`, ajouter un bouton "Créer une ligue" et "Rejoindre une ligue" (input code).
Accessible uniquement si l'user est inscrit à la série.

### 4. Leaderboard de ligue

Dans la page série, si l'user est membre d'une ligue sur cette série :
- Afficher le leaderboard privé de la ligue (membres triés par `correct_predictions` sur cette série)
- Données depuis `registrations` filtrées sur les `league_members`

```ts
// Récupérer les membres de la ligue + leurs stats sur la série
supabase.from('league_members')
  .select('user_id, profiles(username, avatar_url), registrations!inner(correct_predictions, exact_predictions)')
  .eq('league_id', leagueId)
  .eq('registrations.serie_id', serieId)
  .order('registrations.correct_predictions', { ascending: false })
```

### 5. Page `/leagues`

Vue de toutes ses ligues avec lien vers la compétition correspondante et code d'invitation à partager.

### 6. Lien depuis la navbar

Ajouter "Mes ligues" dans la sidebar.

## Tables impactées

- Nouvelles : `leagues`, `league_members`
- `registrations` — lecture (stats pour le leaderboard de ligue)
- `profiles` — lecture

## Dépendances

- Plan 03 (amis) — logiquement lié (on invite ses amis), mais techniquement les ligues fonctionnent avec un code même sans le système d'amis
- Plan 01 (auto-scoring) — pour que les stats du leaderboard de ligue soient à jour

## Ordre recommandé

Implémenter les ligues après le scoring et les amis pour une expérience complète, mais le code d'invitation seul fonctionne en standalone.
