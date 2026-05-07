# grind.gg — CLAUDE.md

Projet annuel école. Plateforme de pronostics esport CS2/Valorant.
**Oral de présentation : mi-juin 2026.**

## Contexte complet

Lire `docs/CONTEXT.md` pour la vue d'ensemble : stack, schéma BDD, flux principal, scoring, état des features.

## Roadmap

### ✅ Terminé

1. **Auto-scoring** (`docs/plans/01-auto-scoring.md`) — cron `/api/cron/score` met à jour `correct_predictions`, `exact_predictions`, `total_shards`
2. **Stats/historique** (`docs/plans/02-stats-history.md`) — page `/profile/stats` + détail par série `/profile/stats/[serieId]`
3. **Amis** (`docs/plans/03-friends.md`) — table `friendships`, page `/friends`, demandes/acceptation/suppression
4. **Ligues privées** (`docs/plans/04-private-leagues.md`) — tables `leagues` + `league_members`, création/invitation/dissolution
5. **League enhancements** (`docs/plans/05-league-enhancements.md`) — `dissolveLeague`, guard owner dans `leaveLeague`
6. **Profil public** (`docs/plans/06-public-profile.md`) — page `/u/[username]`, bouton ami 5 états, stats publiques
7. **Boutique cosmétiques** (`docs/plans/07-shop.md`) — bordures auto (paliers) + achetables + avatars premium, `AvatarWithBorder`, shards

### 🔲 Restant

8. **Polish UI/UX** (`docs/plans/08-polish.md`) — empty states, cohérence visuelle, responsive, onboarding, 404/error/loading
9. **Notifications** (`docs/plans/09-notifications.md`) — in-app uniquement, cloche navbar, badge non lues *(nice to have)*

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
    friends/        ← Amis
    leagues/        ← Ligues privées
    u/[username]/   ← Profil public
    shop/           ← Boutique cosmétiques
  components/       ← Composants React
  lib/
    pandascore.ts   ← Client PandaScore API
    scoring.ts      ← Logique de scoring (shards)
    borders.ts      ← Constantes bordures + getBorderStyle()
    avatars.ts      ← Liste avatars (base + premium)
    supabase/       ← Clients Supabase (server/client/middleware)
  types/
    pandascore.ts   ← Types PandaScore
```
