# Plan 08 — Polish UI/UX

## Objectif

Rendre l'app propre, cohérente et agréable à présenter à l'oral. Couvre les empty states, les animations, l'onboarding et la cohérence visuelle.

## Empty States

Chaque liste vide doit avoir un message explicite et une action suggérée :

| Page | Empty state |
|---|---|
| Home (aucune série) | "Aucune compétition en cours" + explication filtres |
| `/friends` (aucun ami) | Illustration + "Cherchez un joueur par pseudo" |
| `/leagues` (aucune ligue) | "Créez votre première ligue ou rejoignez-en une" |
| `/leagues/[id]` (aucune compétition) | "Inscrivez-vous à une compétition pour commencer" |
| `/profile` (aucun pari) | "Rejoignez une compétition pour placer vos premiers paris" |
| Leaderboard (vide) | Peu probable mais gérer quand même |

## Animations & Transitions

- **Skeleton loaders** sur les listes de séries et leaderboards (Suspense + skeleton cards)
- **Transitions de page** fluides (View Transitions API ou Framer Motion léger)
- **Feedback visuel** sur les actions : bouton "Ajouter" → spinner → "Envoyé ✓"
- **Toast notifications** cohérentes sur toutes les Server Actions (succès/erreur)
- Bouton "Copier le code" → animation checkmark (déjà fait dans league-actions, à uniformiser)

## Cohérence visuelle

- **Nom du projet** : décider entre "PROJECT P" (navbar) et "GRIND.GG" (sidebar) — unifier
- **Couleurs de statut** cohérentes partout :
  - Vert = correct/bon vainqueur
  - Primary (violet) = exact/score parfait
  - Rouge = mauvais pronostic
  - Jaune = en cours/pending
- **Typography** : vérifier que les `font-black uppercase tracking-widest` sont cohérents
- **Responsive** : audit mobile complet — sidebar sur mobile, modales, cards

## Onboarding

Flow pour un nouvel utilisateur :
1. Page de login claire avec description du concept
2. Après signup : modal/page "Comment ça marche ?" (3 étapes : rejoindre une compé → parier → gagner des shards)
3. Tooltip/hint sur le premier pari

## Pages manquantes / 404

- Page 404 custom avec lien retour accueil
- Page d'erreur global (`error.tsx`)
- Loading states (`loading.tsx`) sur les routes lentes

## Performance

- Audit des appels PandaScore en double (profile page refetch des mêmes séries)
- Vérifier les `revalidate` sur toutes les pages dynamiques
- Images optimisées (logos équipes via `next/image` au lieu de `<img>`)

## Dépendances

Aucune — peut être fait en parallèle de n'importe quelle feature.
À faire en dernier pour ne pas repolisher des pages qui changent encore.
