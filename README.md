# grind.gg

> Prouve que tu connais l'esport mieux que tout le monde.

grind.gg est une plateforme de pronostics CS2 & Valorant. Tu rejoins des compétitions, tu parles sur les scores, et tu grimpes le classement. Chaque pari réussi te rapporte des **Shards** — la monnaie du jeu — à dépenser en cosmétiques ou à accumuler pour débloquer des bordures de rang.

Pas de chance. Pas de hasard. Juste de la connaissance.

## Stack

| Couche | Techno |
|--:|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Style | Tailwind CSS + shadcn/ui |
| Auth & Base de données | Supabase |
| Données esport | PandaScore API |
| Hébergement | Vercel + Supabase |

## Fonctionnalités

**Compétitions**
- Suivi des compétitions CS2 et Valorant (tier S/A/B via PandaScore)
- Rejoindre une compétition et parier sur chaque match
- Score exact → **2 Shards** / Bon gagnant → **1 Shard**
- Équipe favorite par compétition : +10 Shards si elle remporte le tournoi

**Progression**
- Classement global par paris réussis
- Bordures de profil débloquées automatiquement par paliers (Bronze, Argent, Or, Diamant)
- Boutique : avatars premium et bordures animées achetables en Shards

**Social**
- Système d'amis (demande, acceptation, suppression)
- Ligues privées : crée ta ligue, invite tes amis, classement interne
- Profils publics `/u/[username]` avec stats et rang

## Authentification

Gérée par **Supabase Auth** (email + password).

- Inscription / connexion sur `/login`
- Session côté serveur via cookies (middleware Next.js)
- Déconnexion via POST sur `/auth/signout`

## Variables d'environnement

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
PANDASCORE_API_KEY=...
CRON_SECRET=...
```

## Lancer le projet en local

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Scoring automatique

Un cron Vercel tourne toutes les 15 minutes (`/api/cron/score`). Il récupère les résultats des matchs terminés et met à jour `correct_predictions`, `exact_predictions` et `total_shards` pour chaque joueur ayant parié.
