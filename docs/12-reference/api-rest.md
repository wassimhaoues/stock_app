# API REST

Base URL locale : `http://localhost:8085`

Swagger reste la référence interactive :

- UI : `http://localhost:8085/swagger-ui.html`
- JSON OpenAPI : `http://localhost:8085/v3/api-docs`

## Authentification

### Connexion

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "admin@stockpro.local",
  "motDePasse": "Admin123!"
}
```

Réponse :

```json
{
  "utilisateur": {
    "id": 1,
    "nom": "Wassim Haoues",
    "email": "admin@stockpro.local",
    "role": "ADMIN",
    "entrepotId": null,
    "entrepotNom": null
  }
}
```

Le backend pose aussi le cookie HTTP-only `STOCKPRO_AUTH`. Pour les clients API qui ne gèrent pas les cookies applicatifs, le JWT peut être transmis via :

```http
Authorization: Bearer <token>
```

### Session courante et déconnexion

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| `GET` | `/api/auth/csrf` | Public | Génère le cookie `XSRF-TOKEN` pour les appels protégés par CSRF |
| `POST` | `/api/auth/login` | Public | Authentifie l'utilisateur et pose le cookie JWT |
| `GET` | `/api/auth/me` | Authentifié | Retourne l'utilisateur courant |
| `POST` | `/api/auth/logout` | Authentifié | Supprime le cookie JWT |

## Endpoints

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| `GET` | `/api/health` | Public | État de l'application |
| `GET` | `/api/entrepots` | `ADMIN`, `GESTIONNAIRE`, `OBSERVATEUR` | Liste les entrepôts visibles |
| `GET` | `/api/entrepots/{id}` | `ADMIN`, affecté à l'entrepôt | Détail d'un entrepôt visible |
| `POST` | `/api/entrepots` | `ADMIN` | Crée un entrepôt |
| `PUT` | `/api/entrepots/{id}` | `ADMIN` | Modifie un entrepôt |
| `DELETE` | `/api/entrepots/{id}` | `ADMIN` | Supprime un entrepôt sans dépendances |
| `GET` | `/api/produits` | `ADMIN`, `GESTIONNAIRE`, `OBSERVATEUR` | Liste le catalogue produits global |
| `GET` | `/api/produits/{id}` | `ADMIN`, `GESTIONNAIRE`, `OBSERVATEUR` | Détail d'un produit |
| `POST` | `/api/produits` | `ADMIN` | Crée un produit |
| `PUT` | `/api/produits/{id}` | `ADMIN` | Modifie un produit |
| `DELETE` | `/api/produits/{id}` | `ADMIN` | Supprime un produit sans stock ni mouvement |
| `GET` | `/api/stocks` | `ADMIN`, `GESTIONNAIRE`, `OBSERVATEUR` | Liste les stocks visibles selon le rôle |
| `GET` | `/api/stocks/{id}` | `ADMIN`, affecté à l'entrepôt | Détail d'un stock visible |
| `POST` | `/api/stocks` | `ADMIN`, `GESTIONNAIRE` | Crée une ligne de stock autorisée |
| `PUT` | `/api/stocks/{id}` | `ADMIN`, `GESTIONNAIRE` | Modifie une ligne de stock autorisée |
| `DELETE` | `/api/stocks/{id}` | `ADMIN`, `GESTIONNAIRE` | Supprime une ligne de stock autorisée |
| `GET` | `/api/mouvements-stock` | `ADMIN`, `GESTIONNAIRE`, `OBSERVATEUR` | Liste l'historique visible selon le rôle |
| `GET` | `/api/mouvements-stock/{id}` | `ADMIN`, affecté à l'entrepôt | Détail d'un mouvement visible |
| `POST` | `/api/mouvements-stock` | `ADMIN`, `GESTIONNAIRE` | Enregistre une entrée ou une sortie |
| `GET` | `/api/alertes` | `ADMIN`, `GESTIONNAIRE`, `OBSERVATEUR` | Liste les stocks où `quantite <= seuilAlerte` |
| `GET` | `/api/dashboard/stats` | `ADMIN`, `GESTIONNAIRE`, `OBSERVATEUR` | Statistiques opérationnelles |
| `GET` | `/api/dashboard/kpis` | `ADMIN`, `GESTIONNAIRE`, `OBSERVATEUR` | KPI métier |
| `GET` | `/api/dashboard/analytics` | `ADMIN`, `GESTIONNAIRE`, `OBSERVATEUR` | Séries et répartitions analytiques |
| `GET` | `/api/dashboard/admin/analytics` | `ADMIN` | Benchmark multi-entrepôts |
| `GET` | `/api/utilisateurs` | `ADMIN` | Liste les utilisateurs |
| `GET` | `/api/utilisateurs/{id}` | `ADMIN` | Détail d'un utilisateur |
| `POST` | `/api/utilisateurs` | `ADMIN` | Crée un utilisateur |
| `PUT` | `/api/utilisateurs/{id}` | `ADMIN` | Modifie un utilisateur |
| `DELETE` | `/api/utilisateurs/{id}` | `ADMIN` | Supprime un utilisateur |

## Payloads de requête

### `EntrepotRequest`

```json
{
  "nom": "Entrepôt Tunis Charguia",
  "adresse": "Zone industrielle Charguia 2, Tunis",
  "capacite": 900
}
```

| Champ | Type | Validation |
|-------|------|------------|
| `nom` | string | Obligatoire |
| `adresse` | string | Obligatoire |
| `capacite` | number | Obligatoire, `>= 1` |

### `ProduitRequest`

```json
{
  "nom": "Apple iPhone 15 128 Go Noir",
  "categorie": "Téléphonie",
  "prix": 3899.00,
  "fournisseur": "iStore Tunisie",
  "seuilMin": 8
}
```

| Champ | Type | Validation |
|-------|------|------------|
| `nom` | string | Obligatoire, unique sans tenir compte de la casse |
| `categorie` | string | Obligatoire |
| `prix` | number | Obligatoire, `> 0` |
| `fournisseur` | string | Obligatoire |
| `seuilMin` | number | Obligatoire, `>= 0` |

### `StockRequest`

```json
{
  "produitId": 1,
  "entrepotId": 1,
  "quantite": 35,
  "seuilAlerte": 6
}
```

| Champ | Type | Validation |
|-------|------|------------|
| `produitId` | number | Produit existant |
| `entrepotId` | number | Entrepôt existant et autorisé |
| `quantite` | number | Obligatoire, `>= 0` |
| `seuilAlerte` | number | Obligatoire, `>= 0` |

### `MouvementStockRequest`

```json
{
  "produitId": 1,
  "entrepotId": 1,
  "type": "ENTREE",
  "quantite": 10
}
```

| Champ | Type | Validation |
|-------|------|------------|
| `produitId` | number | Produit existant |
| `entrepotId` | number | Entrepôt existant et autorisé |
| `type` | enum | `ENTREE` ou `SORTIE` |
| `quantite` | number | Obligatoire, `>= 1` |

### `UtilisateurRequest`

```json
{
  "nom": "Youssef Trabelsi",
  "email": "gestionnaire@stockpro.local",
  "motDePasse": "Gestion123!",
  "role": "GESTIONNAIRE",
  "entrepotId": 1
}
```

| Champ | Type | Validation |
|-------|------|------------|
| `nom` | string | Obligatoire |
| `email` | string | Obligatoire, format email, unique sans tenir compte de la casse |
| `motDePasse` | string ou `null` | Obligatoire en création, optionnel en modification, minimum 8 caractères si fourni |
| `role` | enum | `ADMIN`, `GESTIONNAIRE`, `OBSERVATEUR` |
| `entrepotId` | number ou `null` | Obligatoire pour `GESTIONNAIRE` et `OBSERVATEUR`, nul possible pour `ADMIN` |

## Formats de réponse

### Erreur standard

```json
{
  "status": 400,
  "message": "Message métier lisible",
  "timestamp": "2026-04-23T14:30:00"
}
```

### Erreur de validation

```json
{
  "status": 400,
  "message": "Validation échouée",
  "timestamp": "2026-04-23T14:30:00",
  "errors": {
    "email": "Email invalide",
    "nom": "Le nom est obligatoire"
  }
}
```

| Statut | Cas courant |
|--------|-------------|
| `400` | Requête invalide, validation métier refusée |
| `401` | Authentification absente ou identifiants incorrects |
| `403` | Rôle insuffisant ou accès hors périmètre |
| `404` | Ressource introuvable ou invisible pour l'utilisateur |
| `409` | Conflit métier : doublon, stock insuffisant, capacité dépassée |
| `500` | Erreur serveur non prévue |
