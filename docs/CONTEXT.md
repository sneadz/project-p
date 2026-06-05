# grind.gg — Contexte Projet

## Présentation

**grind.gg** est une plateforme de pronostics esport centrée sur les compétitions **CS2** et **Valorant**.
Les utilisateurs s'inscrivent à des compétitions, parient sur le score des matchs et accumulent des points (shards).

- Projet annuel école — **oral de présentation mi-juin 2026**
- Carte blanche sur les fonctionnalités
- Pas de backend custom : Next.js App Router + Supabase + PandaScore API

---

## Stack technique

| Couche | Techno |
|---|---|
| Frontend / Backend | Next.js 15 (App Router) |
| Base de données + Auth | Supabase (PostgreSQL) |
| Données matchs | PandaScore API |
| UI | Tailwind CSS + shadcn/ui + Radix UI |
| Tests | Vitest |

---

## Schéma base de données

### `profiles`
| Colonne | Type | Description |
|---|---|---|
| id | uuid (FK auth) | Identifiant utilisateur |
| username | text | Pseudo affiché |
| avatar_url | text | ID avatar (ex: `avatar_01`) |
| active_border | text | ID bordure équipée (ex: `border_neon`), null si aucune |
| total_shards | int | Portefeuille actuel (spendable, décrémenté par les achats) |
| shards_earned | int | Cumul à vie (jamais décrémenté — réservé futur classement équitable) |
| correct_predictions | int | Nombre de paris gagnants (bon vainqueur) — utilisé pour le classement |
| exact_predictions | int | Nombre de scores exacts |
| hide_cs2 | bool | Masquer les séries CS2 |
| hide_valorant | bool | Masquer les séries Valorant |

### `registrations`
| Colonne | Type | Description |
|---|---|---|
| user_id | uuid | FK profiles |
| serie_id | int | ID série PandaScore |
| serie_name | text | Nom de la série (stocké au join, évite un appel API) |
| email | text | Email au moment de l'inscription |
| correct_predictions | int | Paris gagnants sur cette série |
| exact_predictions | int | Scores exacts sur cette série |

### `bets`
| Colonne | Type | Description |
|---|---|---|
| user_id | uuid | FK profiles |
| match_id | int | ID match PandaScore |
| serie_id | int | ID série PandaScore |
| score | text | Score pronostiqué (ex: "2-1") |
| updated_at | timestamp | Dernière mise à jour |

### `favorite_teams`
| Colonne | Type | Description |
|---|---|---|
| user_id | uuid | FK profiles |
| serie_id | int | ID série (équipe favorite par compétition) |
| team_id | int | ID équipe PandaScore |
| team_name | text | Nom de l'équipe |
| team_image_url | text | Logo de l'équipe |

### `global_favorite_teams`
| Colonne | Type | Description |
|---|---|---|
| user_id | uuid | FK profiles |
| team_id | int | ID équipe PandaScore |
| team_name | text | Nom de l'équipe |
| team_image_url | text | Logo de l'équipe |

### `friendships`
| Colonne | Type | Description |
|---|---|---|
| requester_id | uuid | FK profiles |
| addressee_id | uuid | FK profiles |
| status | text | `pending` / `accepted` |
| created_at | timestamp | Date de la demande |

### `leagues`
| Colonne | Type | Description |
|---|---|---|
| id | uuid | PK |
| name | text | Nom de la ligue |
| owner_id | uuid | FK profiles (créateur) |
| invite_code | text | Code d'invitation unique |
| created_at | timestamp | — |

### `league_members`
| Colonne | Type | Description |
|---|---|---|
| league_id | uuid | FK leagues |
| user_id | uuid | FK profiles |
| joined_at | timestamp | — |

### `serie_stats`
| Colonne | Type | Description |
|---|---|---|
| user_id | uuid | FK profiles |
| serie_id | int | ID série PandaScore |
| serie_name | text | Nom de la série |
| correct_predictions | int | — |
| exact_predictions | int | — |
| total_bets | int | — |

### `shop_items`
| Colonne | Type | Description |
|---|---|---|
| id | text (PK) | Ex: `border_neon`, `avatar_09` |
| name | text | Nom affiché |
| type | text | `border` ou `avatar` |
| price | int | Prix en shards |

### `user_items`
| Colonne | Type | Description |
|---|---|---|
| user_id | uuid | FK profiles |
| item_id | text | FK shop_items |
| purchased_at | timestamptz | Date d'achat |

---

## Flux principal

```
User → s'inscrit à une série (registrations)
     → parie sur chaque match (bets, score ex: "2-1")
     → quand le match est terminé, le cron recalcule les stats
     → correct_predictions / exact_predictions mis à jour dans registrations + profiles
     → total_shards = correct + exact (décrémenté par achats boutique)
     → shards_earned = cumul à vie (jamais décrémenté)
     → leaderboard trié par correct_predictions + exact_predictions
```

---

## Système de scoring

| Résultat du pari | Points (shards) |
|---|---|
| Score exact (ex: parie 2-1, résultat 2-1) | **2 shards** |
| Bon vainqueur (ex: parie 2-0, résultat 2-1) | **1 shard** |
| Mauvais vainqueur | **0 shard** |

Calculé dans `src/lib/scoring.ts`.

---

## Système de cosmétiques (boutique)

### Bordures automatiques (paliers `correct_predictions`)
| ID | Palier | Couleur |
|---|---|---|
| `border_bronze` | 10 | amber-600 |
| `border_silver` | 25 | slate-300 |
| `border_gold` | 50 | yellow-400 + glow |
| `border_diamond` | 100 | cyan-400 + glow fort |

### Bordures achetables
| ID | Prix | Style |
|---|---|---|
| `border_neon` | 150 shards | Gradient violet/cyan/rose animé |
| `border_phantom` | 100 shards | Blanc avec pulse opacity |

### Avatars premium
| ID | Prix |
|---|---|
| `avatar_09` (Crâne) | 75 shards |
| `avatar_10` (Néon Face) | 75 shards |
| `avatar_11` (Alien) | 75 shards |

**Important :** les couleurs de bordure sont définies en **inline styles** dans `src/lib/borders.ts` (`getBorderStyle()`), pas en classes Tailwind — car `src/lib/` n'est pas scanné par Tailwind.

---

## État des fonctionnalités

### Fait ✅
- Home avec listing séries CS2/Valorant (filtrées tier S/A/B, running + upcoming)
- Page série `/series/[id]` : matchs par phase, paris, leaderboard par série (modale)
- Système de scoring (calcul à la volée)
- Équipes favorites globales + par série
- Leaderboard global `/leaderboard` (trié par correct_predictions + exact_predictions)
- Profil utilisateur `/profile` (avatar, pseudo, préférences jeux)
- Auth Supabase (magic link / OAuth)
- Thème dark/light
- **Auto-scoring cron** — `GET /api/cron/score`, toutes les 15 min via Vercel Cron
- **Stats/historique** — `/profile/stats`, `/profile/stats/[serieId]`
- **Amis** — table `friendships`, `/friends`, recherche + demandes + acceptation
- **Ligues privées** — tables `leagues` + `league_members`, création/invitation/dissolution
- **Profil public** — `/u/[username]`, accessible sans auth, bouton ami 5 états
- **Boutique cosmétiques** — `/shop`, bordures auto + achetables + avatars premium, `AvatarWithBorder` partout
- **RLS Supabase** — politiques sur toutes les tables

### À faire ❌
- **Plan 08 — Polish UI/UX** (`docs/plans/08-polish.md`) — empty states, cohérence visuelle, responsive, onboarding, pages 404/error/loading
- **Plan 09 — Notifications** (`docs/plans/09-notifications.md`) — in-app, cloche navbar, badge *(nice to have)*

---

## Conventions de code

- **Server Components par défaut** — `'use client'` uniquement si interaction ou state nécessaire
- **Server Actions** pour toutes les mutations (`src/app/actions/`)
- **Validation Zod** sur toutes les Server Actions (inputs utilisateur)
- **PandaScore** : les données matchs ne sont jamais stockées en BDD, toujours fetchées via l'API avec cache Next.js
- **Supabase** : `createClient()` côté server, pas de client-side fetch direct
- **Next.js 15** : `params` et `searchParams` sont des `Promise<>` — toujours `await params` dans les pages dynamiques
- **Tailwind** : ne pas mettre de classes dynamiques dans `src/lib/` (non scanné) — utiliser inline styles à la place
