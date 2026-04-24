# Plan 07 — Boutique cosmétiques

## Objectif

Permettre aux joueurs de dépenser leurs shards pour acheter des cosmétiques : avatars premium, bordures de profil, badges. Donne de la valeur à la monnaie shards au-delà du classement.

## Concept

- Les shards sont gagnés en faisant des bons pronostics
- `total_shards` = portefeuille spendable (monte et descend)
- `shards_earned` = cumul à vie (à ajouter pour le classement équitable — voir note CONTEXT.md)
- La boutique vend des items cosmétiques à prix fixes

## Schéma BDD

```sql
-- Items disponibles en boutique (géré manuellement ou via admin)
create table shop_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  type text check (type in ('avatar', 'border', 'badge')) not null,
  image_url text not null,
  price int not null check (price > 0),
  is_available bool default true
);

-- Items achetés par les utilisateurs
create table user_items (
  user_id uuid references profiles(id) on delete cascade,
  item_id uuid references shop_items(id) on delete cascade,
  purchased_at timestamp default now(),
  primary key (user_id, item_id)
);

-- Ajouter à profiles :
alter table profiles add column shards_earned int default 0;
alter table profiles add column active_border text; -- item_id de la bordure active
alter table profiles add column active_badge text;  -- item_id du badge actif
```

## Catégories d'items

### Avatars premium
- Images exclusives non disponibles dans la sélection de base
- Prix : 50–200 shards selon la rareté

### Bordures de profil
- Cadre affiché autour de l'avatar (sur le profil et dans les leaderboards)
- Ex: bordure dorée, néon, animée (CSS)
- Prix : 100–500 shards

### Badges
- Icône affichée sous le pseudo sur le profil public
- Ex: "Early Adopter", "Sniper" (10 scores exacts), badge de ligue
- Certains achetables, d'autres débloqués par achievements
- Prix : 50–300 shards

## Pages

### `/shop`
- Grille d'items disponibles, filtrables par type
- Prix affiché, bouton "Acheter" (confirmation avant achat)
- Items déjà possédés marqués "Possédé" + bouton "Équiper"

### `/profile/edit`
- Section "Cosmétiques" pour équiper les items achetés
- Prévisualisation en temps réel

## Server Actions (`src/app/actions/shop.ts`)

```ts
purchaseItem(itemId)   // Vérifie les shards, débite, ajoute dans user_items
equipItem(itemId, slot) // Met à jour profiles.active_border ou active_badge
```

## Classement équitable

Avec la boutique, il faut distinguer :
- `total_shards` : portefeuille actuel (diminue à l'achat) → affiché sur le profil
- `shards_earned` : cumul à vie jamais décrémenté → utilisé pour le classement global

Mettre à jour le cron et `scoring.ts` pour incrémenter aussi `shards_earned`.

## Dépendances

- Auto-scoring (Plan 01) — source des shards ✅
- Profil public (Plan 06) — pour afficher badges/bordures sur le profil public
- Plan 05 (league bank) — les shards de ligue pourraient acheter des items de ligue
