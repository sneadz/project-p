# Spec — Page de profil publique `/u/[username]`

**Date :** 2026-05-07
**Projet :** grind.gg

---

## Objectif

Permettre à n'importe qui (connecté ou non) de consulter le profil public d'un joueur : ses stats globales, son rang, son historique de compétitions, et d'interagir avec le bouton ami si connecté.

---

## URL

`/u/[username]` — accessible sans authentification.

Si le username n'existe pas → `notFound()` (404).

---

## Layout — Hero centré (option B)

1. **Hero** — avatar grand format centré, username, bouton ami
2. **Stats highlight** — rang global et winrate en deux blocs larges (mise en avant)
3. **Stats secondaires** — 4 colonnes : paris placés, paris réussis, scores exacts, shards
4. **Historique compétitions** — cartes résumé non-cliquables (league, série, Top #N, correct/total)

---

## Architecture

### Route

`src/app/u/[username]/page.tsx` — Server Component pur, pas de `'use client'`.

### Fetches (en parallèle)

1. `profiles` — résoudre `username` → `id`, stats globales (`total_shards`, `correct_predictions`, `exact_predictions`)
2. `serie_stats` — historique compétitions de l'utilisateur cible
3. `profiles` (count) — calculer le rang global (`correct_predictions DESC`, `exact_predictions DESC`)
4. `friendships` — statut ami avec le visiteur connecté (seulement si `user` authentifié)

Pas de nouvelle table. Tout en lecture seule.

---

## Bouton ami — 5 états

| Situation | Rendu |
|---|---|
| Visiteur non connecté | Bouton désactivé "Ajouter en ami" |
| Aucune relation | Formulaire Server Action `sendFriendRequest` |
| Demande déjà envoyée par le visiteur | Label "Demande envoyée" (non interactif) |
| Demande reçue de cet utilisateur | Bouton "Accepter" → `acceptFriendRequest` |
| Déjà amis | Label "Déjà amis" + bouton "Retirer" → `removeFriend` |

Tous les Server Actions sont déjà implémentés dans `src/app/actions/friends.ts`.

---

## Liens entrants à ajouter

| Page | Modification |
|---|---|
| `/leaderboard` | Chaque ligne → `<Link href={/u/${username}}>` |
| `/friends` — liste amis | Chaque entrée → `<Link href={/u/${username}}>` |
| `/friends` — résultats recherche | Chaque entrée → `<Link href={/u/${username}}>` |
| `/series/[id]` leaderboard série (modale) | Si entrées affichées → `<Link href={/u/${username}}>` |

---

## Données affichées

### Profil (depuis `profiles`)
- Avatar (`avatar_url` via `getAvatarSrc`)
- Username
- `total_shards`, `correct_predictions`, `exact_predictions`
- Rang global (calculé via count)
- Winrate — calculé en sommant `total_bets` sur toutes les `serie_stats` du joueur (seuls les matchs finis sont archivés dans `serie_stats`). Si `total_bets = 0`, afficher `—`.

### Historique (depuis `serie_stats`)
- `league_name`, `serie_name`
- `rank`, `total_participants`
- `correct_predictions`, `total_bets`
- `exact_predictions`
- Non-cliquable (résumé seulement)

---

## Ce qui n'est pas inclus

- Page de détail publique par compétition (`/u/[username]/stats/[serieId]`) — hors scope
- Liens depuis les pages de ligues — hors scope pour cette itération
