# Spec — Boutique cosmétiques (Plan 07)

**Date :** 2026-05-07
**Projet :** grind.gg

---

## Objectif

Permettre aux joueurs de dépenser leurs shards pour acheter des bordures d'avatar et des avatars premium. Les bordures auto récompensent la progression, les items achetables donnent de la valeur aux shards.

---

## Inventaire des items

### Bordures automatiques (débloquées par palier, gratuites)

| ID | Nom | Seuil `correct_predictions` | Style CSS |
|---|---|---|---|
| `border_bronze` | Bronze | 10 | `border-amber-700` |
| `border_silver` | Argent | 25 | `border-slate-400` |
| `border_gold` | Or | 50 | `border-yellow-400` + glow jaune |
| `border_diamond` | Diamant | 100 | `border-cyan-400` + glow cyan intense |

### Bordures achetables (shards)

| ID | Nom | Prix | Style CSS |
|---|---|---|---|
| `border_neon` | Néon | 150 shards | dégradé violet/cyan/rose animé |
| `border_phantom` | Phantom | 100 shards | `border-slate-200` + pulse opacity |

### Avatars premium (shards)

| ID | Nom | Prix | Description |
|---|---|---|---|
| `avatar_09` | Crâne | 75 shards | Crâne pixel art, blanc sur fond sombre |
| `avatar_10` | Néon Face | 75 shards | Visage aux contours lumineux style synthwave |
| `avatar_11` | Alien | 75 shards | Silhouette verte avec grands yeux stylisés |

---

## Schéma BDD

### Nouvelles colonnes sur `profiles`
```sql
alter table profiles add column active_border text default null;
alter table profiles add column shards_earned int default 0;
```

- `active_border` : ID de la bordure équipée (`border_bronze`, `border_neon`, etc.), ou `null`
- `shards_earned` : cumul à vie, incrémenté par le cron, jamais décrémenté — réservé pour futur classement équitable

### Nouvelles tables

```sql
create table shop_items (
  id text primary key,
  name text not null,
  type text check (type in ('border', 'avatar')) not null,
  price int not null check (price > 0)
);

create table user_items (
  user_id uuid references profiles(id) on delete cascade,
  item_id text references shop_items(id) on delete cascade,
  purchased_at timestamp default now(),
  primary key (user_id, item_id)
);
```

### Seed `shop_items` (items achetables uniquement)
```sql
insert into shop_items (id, name, type, price) values
  ('border_neon',    'Néon',      'border', 150),
  ('border_phantom', 'Phantom',   'border', 100),
  ('avatar_09',      'Crâne',     'avatar',  75),
  ('avatar_10',      'Néon Face', 'avatar',  75),
  ('avatar_11',      'Alien',     'avatar',  75);
```

---

## Architecture

### Fichiers créés

| Fichier | Rôle |
|---|---|
| `src/lib/borders.ts` | Constante `BORDERS` (toutes bordures auto + achetables) + helpers |
| `src/app/actions/shop.ts` | Server Actions `purchaseItem`, `equipBorder` |
| `src/app/shop/page.tsx` | Page boutique |
| `src/components/avatar-with-border.tsx` | Composant `<AvatarWithBorder>` centralisé |

### Fichiers modifiés

| Fichier | Modification |
|---|---|
| `src/lib/avatars.ts` | Ajout `avatar_09/10/11` avec flag `premium: true` |
| `src/app/profile/edit/page.tsx` | Section "Cosmétiques" + sélecteur bordure active |
| `src/components/profile-form.tsx` | Avatar premium grisé si non possédé |
| `src/app/leaderboard/page.tsx` | Remplace div avatar par `<AvatarWithBorder>` |
| `src/components/serie-leaderboard-modal.tsx` | Idem |
| `src/app/u/[username]/page.tsx` | Idem |
| `src/app/profile/page.tsx` | Idem |
| `src/app/api/cron/score/route.ts` | Incrémente `shards_earned` |
| `src/components/sidebar-nav.tsx` ou navbar | Lien "Boutique" |

---

## Logique d'unlock des bordures auto

Calculée à la volée — pas de BDD. Dans `src/lib/borders.ts` :

```ts
export const AUTO_BORDERS: AutoBorder[] = [
  { id: 'border_bronze',  label: 'Bronze',  threshold: 10,  ... },
  { id: 'border_silver',  label: 'Argent',  threshold: 25,  ... },
  { id: 'border_gold',    label: 'Or',      threshold: 50,  ... },
  { id: 'border_diamond', label: 'Diamant', threshold: 100, ... },
]

export function getUnlockedAutoBorders(correctPredictions: number): string[] {
  return AUTO_BORDERS.filter(b => correctPredictions >= b.threshold).map(b => b.id)
}
```

---

## Composant `<AvatarWithBorder>`

Remplace tous les blocs `<div className="... border-2 border-primary/40 ...">` autour des avatars.

```tsx
interface AvatarWithBorderProps {
  avatarUrl: string | null
  borderId: string | null  // active_border depuis profiles
  size?: 'sm' | 'md' | 'lg'
  alt?: string
}
```

Applique la classe CSS de la bordure correspondante via un map dans `borders.ts`.

---

## Pages

### `/shop`

- Accessible sans connexion (lecture seule)
- Section "Bordures" : auto-unlock (avec seuil + statut débloqué/verrouillé) + achetables
- Section "Avatars premium" : grille avec prix + statut
- Bouton "Acheter" → dialog de confirmation → Server Action `purchaseItem`
- Bouton "Équiper" pour les bordures possédées → `equipBorder`
- Items déjà possédés : badge "Possédé"

### `/profile/edit`

- Section "Cosmétiques" ajoutée après le sélecteur d'avatar
- Sélecteur de bordure : affiche toutes les bordures débloquées/possédées
- Prévisualisation live de l'avatar avec la bordure sélectionnée

---

## Server Actions (`src/app/actions/shop.ts`)

### `purchaseItem(itemId: string)`
1. Auth check
2. Fetch `shop_items` pour le prix
3. Vérifie `profiles.total_shards >= price`
4. Vérifie que l'item n'est pas déjà possédé (`user_items`)
5. Décrémente `total_shards`, insère dans `user_items`
6. `revalidatePath('/shop')`, `revalidatePath('/profile/edit')`

### `equipBorder(borderId: string | null)`
1. Auth check
2. Vérifie que le joueur possède la bordure (auto-unlock ou `user_items`)
3. `update profiles set active_border = borderId`
4. `revalidatePath('/profile/edit')`, `revalidatePath('/profile')`, `revalidatePath('/shop')`
   (leaderboard a `revalidate = 60` — mise à jour automatique dans la minute)

---

## Ce qui n'est pas inclus

- Admin UI pour gérer les items — le seed SQL suffit
- Historique d'achats côté UI — `user_items.purchased_at` existe mais pas affiché
- League Bank (Plan 05 feature 4) — dépend de ce plan mais hors scope ici
- Animations CSS complexes (keyframes) pour les bordures Néon/Phantom — implémentées en Tailwind custom ou inline style, pas de fichier CSS global
