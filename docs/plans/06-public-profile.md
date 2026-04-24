# Plan 06 — Page de profil publique

## Objectif

Permettre de voir le profil d'un autre joueur : ses stats globales, ses compétitions jouées, son rang, et si on est amis avec lui.

## URL

`/u/[username]` — accessible sans connexion (lecture seule)

## Contenu de la page

### Header
- Avatar + username
- Bouton "Ajouter en ami" / "Déjà amis" / "Demande envoyée" (si connecté)
- Badge de ligue + tag (si plan 05 implémenté)

### Stats globales
- Shards totaux, paris réussis, scores exacts, winrate
- Rang global

### Historique des compétitions
- Même liste que sur `/profile` (depuis `serie_stats`)
- Cliquable si on veut voir le détail ? (à discuter — données privées ou publiques)

## Schéma BDD

Pas de nouvelle table. Lecture depuis :
- `profiles` — stats globales
- `serie_stats` — historique compétitions
- `friendships` — statut ami avec le visiteur connecté

## Implémentation

### 1. Route dynamique
`src/app/u/[username]/page.tsx` — Server Component

```ts
// Résoudre le username → user_id
const { data: profile } = await supabase
  .from('profiles')
  .select('id, username, avatar_url, total_shards, correct_predictions, exact_predictions')
  .eq('username', params.username)
  .single()
```

### 2. Statut ami (si connecté)
```ts
// Vérifier la relation avec le visiteur
supabase.from('friendships')
  .select('id, status, requester_id')
  .or(`requester_id.eq.${visitorId},addressee_id.eq.${visitorId}`)
  .or(`requester_id.eq.${profileId},addressee_id.eq.${profileId}`)
```

### 3. Liens vers ce profil
- Depuis la page amis `/friends` : chaque ami cliquable → `/u/[username]`
- Depuis les leaderboards : chaque entrée cliquable → `/u/[username]`
- Depuis les encarts de ligue

## Dépendances

- Plan 03 (amis) — pour le bouton ami ✅
- Plan 02 (stats) — pour l'historique compétitions ✅
