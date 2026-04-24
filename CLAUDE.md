# grind.gg — CLAUDE.md

Projet annuel école. Plateforme de pronostics esport CS2/Valorant.
**Oral de présentation : mi-juin 2026.**

## Contexte complet

Lire `docs/CONTEXT.md` pour la vue d'ensemble : stack, schéma BDD, flux principal, scoring, état des features.

## Roadmap

Les features restantes à implémenter, dans l'ordre de priorité :

1. **Auto-scoring** (`docs/plans/01-auto-scoring.md`) — cron qui met à jour les stats en BDD
2. **Stats/historique** (`docs/plans/02-stats-history.md`) — page `/profile/stats`
3. **Amis** (`docs/plans/03-friends.md`) — table `friendships`, page `/friends`
4. **Ligues privées** (`docs/plans/04-private-leagues.md`) — tables `leagues` + `league_members`

## Conventions

- Server Components par défaut, `'use client'` uniquement si state/interaction
- Server Actions pour toutes les mutations (`src/app/actions/`)
- Validation Zod sur tous les inputs des Server Actions
- PandaScore : jamais stocké en BDD, toujours fetchés avec cache Next.js
- Supabase : `createClient()` côté server uniquement pour les mutations

## Structure src/

```
src/
  app/
    actions/        ← Server Actions (mutations)
    api/            ← API Routes (cron, webhooks)
    series/[id]/    ← Page compétition
    profile/        ← Profil + stats
    leaderboard/    ← Classement global
    friends/        ← (à créer) Amis
    leagues/        ← (à créer) Ligues privées
  components/       ← Composants React
  lib/
    pandascore.ts   ← Client PandaScore API
    scoring.ts      ← Logique de scoring (shards)
    supabase/       ← Clients Supabase (server/client/middleware)
  types/
    pandascore.ts   ← Types PandaScore
```
