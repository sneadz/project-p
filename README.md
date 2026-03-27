# PROJECT P

> Project P is an esports pick'em platform for CS2 & Valorant — predict match outcomes, earn points and climb the leaderboard.

## Stack

| Couche | Techno |
|--:|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Style | Tailwind CSS + shadcn/ui |
| Auth & Base de données | Supabase |
| Données esport | PandaScore API |
| Hébergement | Vercel + Supabase |

## Authentification

L'auth est gérée par **Supabase Auth** (email + password).

- Inscription / connexion sur `/login`
- Après inscription, un email de confirmation est envoyé
- La session est gérée côté serveur via des cookies (middleware Next.js)
- Déconnexion via POST sur `/auth/signout`

Les variables d'environnement nécessaires :

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
PANDASCORE_API_KEY=...
```

## Lancer le projet en local

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Fonctionnalités

- Affichage des compétitions CS2 et Valorant (tier S/A via PandaScore)
- Rejoindre une compétition
- Parier sur les matchs avec des points fictifs
- Classement des points par compétition
- Leaderboard global (à venir)
- Système d'amis et ligues privées (à venir)
