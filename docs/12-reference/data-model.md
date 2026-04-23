# Modèle de données

Le backend utilise MySQL 8.0 avec Hibernate `ddl-auto=update`. Le schéma de référence est versionné dans `infra/mysql-init/01-schema.sql`.

## Tables principales

| Table | Rôle |
|-------|------|
| `entrepots` | Sites de stockage avec capacité maximale |
| `utilisateurs` | Comptes applicatifs et rôle RBAC |
| `produits` | Catalogue global des produits |
| `stocks` | Quantité d'un produit dans un entrepôt |
| `mouvement_stock` | Historique des entrées et sorties |

## Colonnes

### `entrepots`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | `BIGINT` | PK, auto-increment |
| `nom` | `VARCHAR(255)` | Obligatoire, unique |
| `adresse` | `VARCHAR(255)` | Obligatoire |
| `capacite` | `INT` | Obligatoire, `>= 1` côté application |

### `utilisateurs`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | `BIGINT` | PK, auto-increment |
| `nom` | `VARCHAR(255)` | Obligatoire |
| `email` | `VARCHAR(255)` | Obligatoire, unique |
| `mot_de_passe` | `VARCHAR(255)` | Obligatoire, hash BCrypt |
| `role` | `ENUM` | `ADMIN`, `GESTIONNAIRE`, `OBSERVATEUR` |
| `entrepot_id` | `BIGINT` | FK optionnelle vers `entrepots.id` |

### `produits`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | `BIGINT` | PK, auto-increment |
| `nom` | `VARCHAR(255)` | Obligatoire, unicité contrôlée côté service sans tenir compte de la casse |
| `categorie` | `VARCHAR(255)` | Obligatoire |
| `prix` | `DECIMAL(12,2)` | Obligatoire, `> 0` |
| `fournisseur` | `VARCHAR(255)` | Obligatoire |
| `seuil_min` | `INT` | Obligatoire, `>= 0` |

### `stocks`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | `BIGINT` | PK, auto-increment |
| `produit_id` | `BIGINT` | FK vers `produits.id` |
| `entrepot_id` | `BIGINT` | FK vers `entrepots.id` |
| `quantite` | `INT` | Obligatoire, `>= 0` |
| `seuil_alerte` | `INT` | Obligatoire, `>= 0` |

Contrainte unique : une seule ligne par paire `(produit_id, entrepot_id)`.

### `mouvement_stock`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | `BIGINT` | PK, auto-increment |
| `produit_id` | `BIGINT` | FK vers `produits.id` |
| `entrepot_id` | `BIGINT` | FK vers `entrepots.id` |
| `type` | `ENUM` | `ENTREE`, `SORTIE` |
| `quantite` | `INT` | Obligatoire, `>= 1` |
| `date` | `DATETIME` | Obligatoire |

## Relations

```text
entrepots 1 ── n utilisateurs
entrepots 1 ── n stocks
produits  1 ── n stocks
entrepots 1 ── n mouvement_stock
produits  1 ── n mouvement_stock
```

## Règles métier

| Règle | Application |
|-------|-------------|
| Un `GESTIONNAIRE` ou un `OBSERVATEUR` doit être affecté à un entrepôt | `UtilisateurService` |
| Les emails utilisateurs sont uniques sans tenir compte de la casse | `UtilisateurService` |
| Les noms de produits sont uniques sans tenir compte de la casse | `ProduitService` |
| Une paire produit/entrepôt ne peut avoir qu'une seule ligne de stock | `StockService` + contrainte SQL |
| Une sortie est refusée si la quantité disponible est insuffisante | `MouvementStockService` |
| Une création ou modification de stock est refusée si la capacité est dépassée | `StockService` |
| Une entrée de stock est refusée si la capacité est dépassée | `MouvementStockService` |
| Une alerte est active quand `quantite <= seuilAlerte` | `AlerteService` |
| Un entrepôt utilisé ne peut pas être supprimé | `EntrepotService` |
| Un produit utilisé ne peut pas être supprimé | `ProduitService` |

## Index utiles

| Index | Table | Usage |
|-------|-------|-------|
| `uk_entrepots_nom` | `entrepots` | Unicité du nom d'entrepôt |
| `uk_utilisateurs_email` | `utilisateurs` | Unicité de l'email |
| `uk_stocks_produit_entrepot` | `stocks` | Unicité produit + entrepôt |
| `idx_stocks_produit_id` | `stocks` | Jointure stock → produit |
| `idx_stocks_entrepot_id` | `stocks` | Filtrage par entrepôt |
| `idx_mouvement_stock_produit_id` | `mouvement_stock` | Historique par produit |
| `idx_mouvement_stock_entrepot_id` | `mouvement_stock` | Historique par entrepôt |
| `idx_mouvement_stock_date` | `mouvement_stock` | Analytics temporelles |
