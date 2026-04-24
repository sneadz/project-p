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
| avatar_url | text | URL avatar |
| total_shards | int | Portefeuille actuel (monte/descend selon achats cosmétiques) |
| correct_predictions | int | Nombre de paris gagnants (bon vainqueur) — utilisé pour le classement |
| exact_predictions | int | Nombre de scores exacts |
| hide_cs2 | bool | Masquer les séries CS2 |
| hide_valorant | bool | Masquer les séries Valorant |

> **Note design shards :** Les shards sont une monnaie interne (future boutique cosmétiques). `total_shards` est le portefeuille spendable. Le classement trie par `correct_predictions` + `exact_predictions` pour ne pas pénaliser ceux qui dépensent leurs shards. Quand la boutique sera implémentée, ajouter une colonne `shards_earned` (cumul à vie, jamais décrémenté) pour un classement encore plus juste.

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

---

## Flux principal

```
User → s'inscrit à une série (registrations)
     → parie sur chaque match (bets, score ex: "2-1")
     → quand le match est terminé, le cron recalcule les stats
     → correct_predictions / exact_predictions mis à jour
     → leaderboard affiché en temps réel
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

## État des fonctionnalités

### Fait ✅
- Home avec listing séries CS2/Valorant (filtrées tier S/A/B, running + upcoming)
- Page série `/series/[id]` : matchs par phase, paris, leaderboard par série
- Système de scoring (calcul à la volée)
- Équipes favorites globales + par série
- Leaderboard global `/leaderboard`
- Profil utilisateur `/profile` (avatar, pseudo, préférences jeux)
- Auth Supabase (magic link / OAuth)
- Thème dark/light
- Responsive mobile

### À faire ❌
- **Auto-scoring automatique** — mise à jour des stats en BDD via cron (voir `plans/01-auto-scoring.md`)
- **Page stats/historique** — historique des paris, taux de réussite (voir `plans/02-stats-history.md`)
- **Système d'amis** — recherche d'users, demandes d'amitié (voir `plans/03-friends.md`)
- **Ligues privées** — leaderboards privés par compétition avec ses amis (voir `plans/04-private-leagues.md`)

---

## Conventions de code

- **Server Components par défaut** — `'use client'` uniquement si interaction ou state nécessaire
- **Server Actions** pour toutes les mutations (`src/app/actions/`)
- **Validation Zod** sur toutes les Server Actions (inputs utilisateur)
- **PandaScore** : les données matchs ne sont jamais stockées en BDD, toujours fetchées via l'API avec cache Next.js
- **Supabase** : `createClient()` côté server, pas de client-side fetch direct
