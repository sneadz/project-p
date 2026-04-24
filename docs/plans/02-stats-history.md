# Plan 02 — Page stats / historique

## Objectif

Donner à l'utilisateur une vue détaillée de ses performances : historique de ses paris par compétition, taux de réussite, et ses meilleures stats.

## Prérequis

- Plan 01 (auto-scoring) doit être en place pour que les stats en BDD soient fiables

## Approche retenue

Nouvelle page `/profile/stats` accessible depuis la navbar et le profil. Données 100% en base Supabase, pas d'appel PandaScore nécessaire (on se base sur `bets` et `registrations`).

## Contenu de la page

### Section 1 — Résumé global
- Total shards gagnés
- Nombre de paris joués / gagnés / exacts
- Taux de réussite (% bon vainqueur)
- Taux de précision (% score exact)

### Section 2 — Historique par compétition
Liste des compétitions auxquelles l'user a participé, triées par date décroissante :
- Nom de la série + logo jeu
- Shards gagnés sur cette série
- Correct / Exact sur cette série
- Rang dans le leaderboard de la série

### Section 3 — Détail d'une compétition (expandable ou page dédiée)
Au clic sur une compétition : liste de tous les bets placés avec résultat (bon/mauvais/exact).

## Étapes d'implémentation

### 1. Requêtes Supabase nécessaires

```ts
// Stats globales depuis profiles
supabase.from('profiles').select('total_shards, correct_predictions, exact_predictions').eq('id', userId)

// Historique des registrations
supabase.from('registrations')
  .select('serie_id, correct_predictions, exact_predictions')
  .eq('user_id', userId)

// Détail des bets d'une série
supabase.from('bets')
  .select('match_id, score, updated_at')
  .eq('user_id', userId)
  .eq('serie_id', serieId)
```

### 2. Enrichissement des données série

Les noms de séries ne sont pas en BDD (données PandaScore). Deux options :
- **Option A** : Appeler PandaScore pour chaque serie_id (lent, API calls)
- **Option B** : Stocker le nom de la série dans `registrations` au moment du join (recommandé)

→ Ajouter colonne `serie_name` dans `registrations` et la remplir dans `joinCompetition()`.

### 3. Créer la page

Fichier : `src/app/profile/stats/page.tsx` (Server Component)

### 4. Lien depuis la navbar / profil

Ajouter un lien "Mes stats" dans la sidebar et la page `/profile`.

## Tables impactées

- `profiles` — lecture
- `registrations` — lecture + ajout colonne `serie_name`
- `bets` — lecture

## Dépendances

- Plan 01 (auto-scoring) pour avoir des stats fiables en BDD
