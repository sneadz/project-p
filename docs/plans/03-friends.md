# Plan 03 — Système d'amis

## Objectif

Permettre aux utilisateurs de se trouver, s'ajouter en ami et voir leurs amis — prérequis pour les ligues privées.

## Approche retenue

Table `friendships` avec statut (pending/accepted). Page `/friends` pour gérer ses amis. Recherche d'users par username.

## Schéma BDD

### Nouvelle table `friendships`

```sql
create table friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references profiles(id) on delete cascade,
  addressee_id uuid references profiles(id) on delete cascade,
  status text check (status in ('pending', 'accepted')) default 'pending',
  created_at timestamp default now(),
  unique (requester_id, addressee_id)
);
```

Index utiles :
- `(addressee_id, status)` — pour trouver les demandes reçues en attente
- `(requester_id, status)` — pour trouver les demandes envoyées

## Étapes d'implémentation

### 1. Créer la table en Supabase

Appliquer la migration SQL ci-dessus.

### 2. Server Actions

Fichier : `src/app/actions/friends.ts`

- `sendFriendRequest(addresseeId)` — crée une ligne `pending`
- `acceptFriendRequest(friendshipId)` — passe à `accepted`
- `removeFriend(friendshipId)` — supprime la ligne

### 3. Page `/friends`

Fichier : `src/app/friends/page.tsx`

Sections :
- **Recherche** : input pour chercher un user par username → appel Supabase `ilike`
- **Demandes reçues** : liste des `pending` où `addressee_id = user.id`
- **Mes amis** : liste des `accepted` (requester ou addressee)

### 4. Requête "liste d'amis"

La relation est bidirectionnelle donc il faut requêter dans les deux sens :

```ts
supabase.from('friendships')
  .select('*, requester:profiles!requester_id(id, username, avatar_url), addressee:profiles!addressee_id(id, username, avatar_url)')
  .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
  .eq('status', 'accepted')
```

### 5. Lien depuis la navbar

Ajouter "Amis" dans la sidebar/navbar.

## Tables impactées

- Nouvelle : `friendships`
- `profiles` — lecture (recherche, affichage)

## Dépendances

Aucune — peut être implémenté indépendamment du plan 01 et 02.
Prérequis pour le plan 04 (ligues privées).
