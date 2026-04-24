# Plan 05 — Améliorations des ligues privées

## Objectif

Enrichir les ligues privées avec de la personnalisation, un système de tag visible dans les classements, et une économie de shards commune.

---

## Feature 1 — Photo de profil de ligue

### Concept
Chaque ligue choisit une image parmi un set prédéfini (même système que les avatars utilisateur). L'image s'affiche sur la page de la ligue et dans les encarts de compétition.

### Schéma BDD
```sql
-- Ajouter à la table leagues :
alter table leagues add column image_url text;
```

### Implémentation
- Ajouter un sélecteur d'image dans les settings de la ligue (`/leagues/[id]/settings`)
- Images stockées dans `/public/leagues/` (ex: `shield-01.png`, `dragon-02.png`...)
- Seul le owner peut changer l'image
- Afficher l'image sur `/leagues/[id]` et dans la liste `/leagues`

---

## Feature 2 — Tag de ligue

### Concept
Un tag court (3-5 caractères, ex: `[GRD]`) choisi par le owner, affiché devant le pseudo dans :
- Le leaderboard global (`/leaderboard`)
- Le leaderboard de série (modale Classement)
- La page profil utilisateur
- Les encarts de compétition dans `/leagues/[id]`

### Schéma BDD
```sql
-- Ajouter à la table leagues :
alter table leagues add column tag text check (char_length(tag) between 2 and 5);

-- Pour afficher le tag facilement dans les classements,
-- une view ou une jointure league_members → leagues
```

### Logique d'affichage
- Un user peut être dans plusieurs ligues → afficher le tag de **la ligue principale** (à définir : première ligue rejointe, ou choix utilisateur)
- Ou afficher tous les tags si l'user est dans plusieurs ligues (ex: `[GRD][PRO] username`)
- Format : `[TAG] username` en gras, tag coloré avec la couleur primaire

### Implémentation
- Ajouter `tag` dans `leagues` (unique conseillé)
- Server Action `updateLeagueTag(leagueId, tag)` — owner only
- Modifier les queries de leaderboard pour join `league_members → leagues` et récupérer le tag
- Composant `PlayerTag` réutilisable : `<span>[GRD]</span> username`

---

## Feature 3 — Stats de ligue

### Concept
Statistiques agrégées de tous les membres de la ligue :
- Total de paris réussis (somme des `correct_predictions` de tous les membres)
- Total de scores exacts
- Total de shards gagnés par les membres
- Classement des membres en banque de shards (qui a le plus de shards)

### Affichage
Sur `/leagues/[id]`, une section "Stats de la ligue" avec des cartes :
- `🎯 X paris réussis` (cumul de tous les membres)
- `💎 X shards cumulés` (somme des `total_shards` des membres)
- `⚡ X scores exacts`
- Meilleur joueur de la ligue (member avec le plus de `correct_predictions` globales)

### Implémentation
- Pas de colonne supplémentaire — calculé à la volée depuis `profiles` (total_shards, correct_predictions, exact_predictions) des membres
- Calculé côté serveur dans `/leagues/[id]/page.tsx`

---

## Feature 4 — Économie de shards de ligue (League Bank)

### Concept
Les membres peuvent **déposer des shards** dans une cagnotte commune de ligue. La ligue accumule des shards pour débloquer des améliorations ou du cosmétique.

### Schéma BDD
```sql
-- Ajouter à la table leagues :
alter table leagues add column bank_shards int default 0;

-- Historique des dépôts (optionnel mais recommandé) :
create table league_deposits (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  amount int not null check (amount > 0),
  created_at timestamp default now()
);
```

### Flow
1. User clique "Déposer des shards" sur `/leagues/[id]`
2. Choisit un montant (input ou boutons prédéfinis : 10, 50, 100)
3. Server Action `depositShards(leagueId, amount)` :
   - Vérifie que l'user a assez de shards (`profiles.total_shards >= amount`)
   - Décrémente `profiles.total_shards`
   - Incrémente `leagues.bank_shards`
   - Insère dans `league_deposits`
4. Afficher la banque sur la page de ligue + historique des dépôts

### Améliorations débloquables (exemples)
Dépenser les shards de la banque pour :
- **Changer l'image de ligue** (coût : 50 shards) — débloque des images premium
- **Changer la couleur du tag** (coût : 100 shards) — tag en doré, rouge...
- **Boost de XP temporaire** (coût : 200 shards) — les membres gagnent 2x les shards pendant 7 jours
- **Badge de ligue** sur la page profil des membres

---

## Ordre d'implémentation recommandé

1. **Tag** — impact visuel immédiat dans tous les classements, peu de BDD
2. **Photo de profil** — simple, rend les ligues identifiables
3. **Stats de ligue** — lecture seule, zéro schéma BDD
4. **League Bank** — le plus complexe, à faire après la boutique cosmétiques (Plan 06)

## Dépendances

- Plan 04 (ligues) — base requise ✅
- Boutique cosmétiques (Plan 06, pas encore écrit) — nécessaire pour que les dépenses de shards aient du sens dans un contexte plus large
