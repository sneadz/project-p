# Plan 09 — Notifications (à réfléchir)

## Objectif

Informer l'utilisateur d'événements importants sans qu'il ait besoin de checker l'app constamment.

## Questions ouvertes (à trancher avant d'implémenter)

### 1. Quel canal ?

| Canal | Avantages | Inconvénients |
|---|---|---|
| **In-app** (cloche dans la navbar) | Simple à implémenter, pas d'infra | L'user doit ouvrir l'app |
| **Email** | Déjà configuré via Supabase Auth | Spam perçu, opt-in nécessaire |
| **Push web** (Service Worker) | Notifs même app fermée | Complexe, user doit accepter les permissions |

→ **Recommandation** : commencer par in-app uniquement, email optionnel.

### 2. Quels événements notifier ?

| Événement | Pertinence | Notes |
|---|---|---|
| Demande d'ami reçue | ⭐⭐⭐ | Haute — action requise |
| Demande d'ami acceptée | ⭐⭐ | Moyenne |
| Quelqu'un rejoint ta ligue | ⭐⭐⭐ | Haute — événement social |
| Match terminé + résultat pari | ⭐⭐ | Redondant avec le scoring auto |
| Ami inscrit à la même compétition | ⭐ | Faible — peut être intrusif |
| Nouveau match dans une série suivie | ⭐ | Faible |

### 3. Temps réel ou polling ?

- **Polling** (revalidation Next.js toutes les X secondes) : simple mais pas instantané
- **Supabase Realtime** (websockets) : temps réel mais `'use client'` requis dans la navbar
- **Server-Sent Events** : bon compromis mais complexe à mettre en place

## Schéma BDD (si in-app)

```sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null, -- 'friend_request', 'friend_accepted', 'league_join'
  data jsonb,         -- { from_username, league_name, ... }
  read bool default false,
  created_at timestamp default now()
);

create index on notifications (user_id, read, created_at desc);
```

## UI (in-app)

- Icône cloche dans la navbar/sidebar avec badge rouge (count non lues)
- Dropdown ou page `/notifications` avec liste
- Marquer comme lu au clic
- Lien contextuel selon le type (demande ami → `/friends`, ligue → `/leagues/[id]`)

## Triggers

Les notifications seraient créées dans les Server Actions existants :
- `sendFriendRequest()` → notif pour l'addressee
- `acceptFriendRequest()` → notif pour le requester
- `joinLeague()` → notif pour le owner de la ligue

## Dépendances

- Plan 03 (amis) ✅
- Plan 04 (ligues) ✅
- Décision sur le canal avant de commencer

## Verdict

Feature "nice to have" pour l'oral — **à implémenter en dernier**, après polish, si le temps le permet. Le système in-app est faisable en ~1 journée une fois les autres features stables.
