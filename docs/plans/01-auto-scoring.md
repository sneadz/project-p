# Plan 01 — Auto-scoring automatique

## Objectif

Mettre à jour automatiquement les stats des utilisateurs (`correct_predictions`, `exact_predictions`, `total_shards`) dans Supabase quand des matchs se terminent, sans intervention manuelle.

## Problème actuel

Le scoring est calculé à la volée à chaque chargement de page (`calculateSerieStats` dans `src/lib/scoring.ts`), mais les colonnes de stats dans `registrations` et `profiles` ne sont jamais mises à jour automatiquement. Le leaderboard affiche donc des valeurs potentiellement obsolètes.

## Approche retenue

**API Route Next.js + cron externe**

- Créer `/api/cron/score` (route protégée par un token secret)
- Appeler cette route toutes les 15 minutes via un service cron (Vercel Cron si déployé sur Vercel, sinon cron-job.org gratuit)
- La route récupère tous les matchs terminés depuis PandaScore, recalcule les bets de chaque user inscrit, et met à jour la BDD

## Étapes d'implémentation

### 1. Créer la route API `/api/cron/score`

Fichier : `src/app/api/cron/score/route.ts`

Logique :
1. Vérifier le token secret (`Authorization: Bearer <CRON_SECRET>`)
2. Récupérer toutes les `registrations` actives (séries non terminées)
3. Pour chaque série, récupérer les matchs via PandaScore (`getMatchesBySerie`)
4. Pour chaque user inscrit, récupérer ses `bets` sur cette série
5. Calculer `correct_predictions`, `exact_predictions`, `shards` via `calculateSerieStats`
6. Mettre à jour `registrations` (stats par série)
7. Recalculer et mettre à jour `profiles` (stats globales, somme de toutes les séries)

### 2. Ajouter la variable d'environnement

```
CRON_SECRET=<token aléatoire fort>
```

### 3. Configurer le cron

**Option Vercel (si hébergé sur Vercel) :**
```json
// vercel.json
{
  "crons": [{ "path": "/api/cron/score", "schedule": "*/15 * * * *" }]
}
```

**Option cron-job.org (gratuit, universel) :**
- Créer un job qui appelle `https://grind.gg/api/cron/score`
- Header : `Authorization: Bearer <CRON_SECRET>`
- Toutes les 15 minutes

### 4. Ajouter un endpoint de déclenchement manuel

Route `/api/cron/score?serie_id=XXX` pour forcer le recalcul d'une série spécifique (utile en dev et pour tester).

## Tables impactées

- `bets` — lecture
- `registrations` — mise à jour `correct_predictions`, `exact_predictions`
- `profiles` — mise à jour `correct_predictions`, `exact_predictions`, `total_shards`

## Dépendances

Aucune — peut être implémenté en premier.

## Tests

- `src/lib/scoring.test.ts` existe déjà, vérifier que les cas limites sont couverts
- Tester la route avec un appel curl en dev
