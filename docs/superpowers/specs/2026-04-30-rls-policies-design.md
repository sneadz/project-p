# RLS Policies — grind.gg

**Date:** 2026-04-30  
**Status:** Approved

## Contexte

Supabase a détecté que toutes les tables du projet sont publiquement accessibles (RLS désactivé). N'importe qui avec l'URL du projet peut lire, modifier et supprimer toutes les données.

## Contraintes

- Toutes les mutations passent par des Server Actions (`createClient()` avec anon key + session utilisateur) → `auth.uid()` disponible dans les policies
- Le cron `/api/cron/score` utilise `createAdminClient()` (service role) → bypasse RLS, aucun impact
- Le leaderboard (`/leaderboard`) est auth-only
- La page `/series/[id]` est publique mais ne lit aucune donnée BDD pour les visiteurs non connectés

## Approche retenue

**Auth-gated reads, ownership writes** :
- SELECT : tout utilisateur authentifié peut lire les tables nécessaires au leaderboard (`profiles`, `registrations`, `bets`)
- INSERT/UPDATE/DELETE : uniquement ses propres lignes
- Tables personnelles (favoris) : lecture et écriture restreintes à `user_id = auth.uid()`
- Tables sociales : scoped aux participants

## Policies par table

### `profiles`
| Opération | Condition |
|---|---|
| SELECT | `auth.role() = 'authenticated'` |
| INSERT | `auth.uid() = id` |
| UPDATE | `auth.uid() = id` |
| DELETE | `auth.uid() = id` |

### `registrations`
| Opération | Condition |
|---|---|
| SELECT | `auth.role() = 'authenticated'` |
| INSERT | `auth.uid() = user_id` |
| UPDATE | `auth.uid() = user_id` |
| DELETE | `auth.uid() = user_id` |

### `bets`
| Opération | Condition |
|---|---|
| SELECT | `auth.role() = 'authenticated'` |
| INSERT | `auth.uid() = user_id` |
| UPDATE | `auth.uid() = user_id` |
| DELETE | `auth.uid() = user_id` |

### `favorite_teams`
| Opération | Condition |
|---|---|
| SELECT | `auth.uid() = user_id` |
| INSERT | `auth.uid() = user_id` |
| UPDATE | `auth.uid() = user_id` |
| DELETE | `auth.uid() = user_id` |

### `global_favorite_teams`
| Opération | Condition |
|---|---|
| SELECT | `auth.uid() = user_id` |
| INSERT | `auth.uid() = user_id` |
| UPDATE | `auth.uid() = user_id` |
| DELETE | `auth.uid() = user_id` |

### `friendships`
| Opération | Condition |
|---|---|
| SELECT | `auth.uid() = requester_id OR auth.uid() = addressee_id` |
| INSERT | `auth.uid() = requester_id` |
| UPDATE | `auth.uid() = addressee_id` |
| DELETE | `auth.uid() = requester_id OR auth.uid() = addressee_id` |

### `leagues`
| Opération | Condition |
|---|---|
| SELECT | `auth.role() = 'authenticated'` (nécessaire pour chercher par invite_code avant d'être membre) |
| INSERT | `auth.uid() = owner_id` |
| UPDATE | `auth.uid() = owner_id` |
| DELETE | `auth.uid() = owner_id` |

### `league_members`
| Opération | Condition |
|---|---|
| SELECT | `league_id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid())` |
| INSERT | `auth.uid() = user_id` |
| DELETE | `auth.uid() = user_id` |

## Implémentation

Les policies sont appliquées via une migration SQL exécutée dans le dashboard Supabase (SQL Editor) ou via `supabase db push`. Chaque table reçoit d'abord `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, puis les `CREATE POLICY` correspondantes.

Aucun changement de code applicatif n'est nécessaire — toutes les Server Actions utilisent déjà `createClient()` avec la session utilisateur.
