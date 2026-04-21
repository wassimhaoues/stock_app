# StockPro API

Base URL locale : `http://localhost:8085`

Toutes les routes `/api/**`, sauf authentification et santé, attendent un JWT dans l'en-tête :

```http
Authorization: Bearer <token>
```

## Endpoints

| Méthode | Route | Accès | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | Public | Connexion et émission du JWT |
| `GET` | `/api/health` | Public | État de l'application |
| `GET` | `/api/entrepots` | `ADMIN`, `GESTIONNAIRE`, `OBSERVATEUR` | Liste des entrepôts visibles |
| `GET` | `/api/entrepots/{id}` | `ADMIN`, affecté à l'entrepôt | Détail d'un entrepôt visible |
| `POST` | `/api/entrepots` | `ADMIN` | Création d'un entrepôt |
| `PUT` | `/api/entrepots/{id}` | `ADMIN` | Modification d'un entrepôt |
| `DELETE` | `/api/entrepots/{id}` | `ADMIN` | Suppression d'un entrepôt sans dépendances |
| `GET` | `/api/produits` | `ADMIN`, `GESTIONNAIRE`, `OBSERVATEUR` | Catalogue produits global |
| `GET` | `/api/produits/{id}` | `ADMIN`, `GESTIONNAIRE`, `OBSERVATEUR` | Détail produit |
| `POST` | `/api/produits` | `ADMIN` | Création produit |
| `PUT` | `/api/produits/{id}` | `ADMIN` | Modification produit |
| `DELETE` | `/api/produits/{id}` | `ADMIN` | Suppression produit sans stock ni mouvement |
| `GET` | `/api/stocks` | `ADMIN`, `GESTIONNAIRE`, `OBSERVATEUR` | Stocks visibles selon le rôle |
| `GET` | `/api/stocks/{id}` | `ADMIN`, affecté à l'entrepôt | Détail stock visible |
| `POST` | `/api/stocks` | `ADMIN`, `GESTIONNAIRE` | Création d'une ligne de stock autorisée |
| `PUT` | `/api/stocks/{id}` | `ADMIN`, `GESTIONNAIRE` | Modification d'une ligne de stock autorisée |
| `DELETE` | `/api/stocks/{id}` | `ADMIN`, `GESTIONNAIRE` | Suppression d'une ligne de stock autorisée |
| `GET` | `/api/mouvements-stock` | `ADMIN`, `GESTIONNAIRE`, `OBSERVATEUR` | Historique visible selon le rôle |
| `GET` | `/api/mouvements-stock/{id}` | `ADMIN`, affecté à l'entrepôt | Détail mouvement visible |
| `POST` | `/api/mouvements-stock` | `ADMIN`, `GESTIONNAIRE` | Entrée ou sortie de stock autorisée |
| `GET` | `/api/alertes` | `ADMIN`, `GESTIONNAIRE`, `OBSERVATEUR` | Stocks où `quantite <= seuilAlerte` |
| `GET` | `/api/dashboard/stats` | `ADMIN`, `GESTIONNAIRE`, `OBSERVATEUR` | Statistiques opérationnelles |
| `GET` | `/api/dashboard/kpis` | `ADMIN`, `GESTIONNAIRE`, `OBSERVATEUR` | KPI métier |
| `GET` | `/api/dashboard/analytics` | `ADMIN`, `GESTIONNAIRE`, `OBSERVATEUR` | Séries et répartitions analytiques |
| `GET` | `/api/dashboard/admin/analytics` | `ADMIN` | Benchmark multi-entrepôts |
| `GET` | `/api/utilisateurs` | `ADMIN` | Liste utilisateurs |
| `GET` | `/api/utilisateurs/{id}` | `ADMIN` | Détail utilisateur |
| `POST` | `/api/utilisateurs` | `ADMIN` | Création utilisateur |
| `PUT` | `/api/utilisateurs/{id}` | `ADMIN` | Modification utilisateur |
| `DELETE` | `/api/utilisateurs/{id}` | `ADMIN` | Suppression utilisateur |

Swagger reste disponible sur `/swagger-ui.html` et le JSON OpenAPI sur `/v3/api-docs`.

## Matrice des rôles

| Rôle | Périmètre | Droits principaux |
| --- | --- | --- |
| `ADMIN` | Tous les entrepôts | Administration complète : utilisateurs, entrepôts, produits, stocks, mouvements, alertes, dashboard global |
| `GESTIONNAIRE` | Uniquement son entrepôt affecté | Lecture de son périmètre, création/modification/suppression de stocks et mouvements dans son entrepôt |
| `OBSERVATEUR` | Uniquement son entrepôt affecté | Lecture seule : dashboard, entrepôt affecté, catalogue, stocks, mouvements et alertes |

Le filtrage par entrepôt est appliqué côté backend. Modifier manuellement un `entrepotId` dans une requête ne permet pas de sortir de son périmètre : les lectures hors périmètre retournent une ressource introuvable, et les écritures hors périmètre retournent un refus d'accès.

## Règles métier validées

- Un `GESTIONNAIRE` ou un `OBSERVATEUR` doit être affecté à un entrepôt.
- Les emails utilisateurs sont uniques sans tenir compte de la casse.
- Les noms de produits sont uniques sans tenir compte de la casse.
- Une même paire produit/entrepôt ne peut avoir qu'une seule ligne de stock.
- Une sortie de stock est refusée si la quantité disponible est insuffisante.
- Une entrée ou une modification de stock est refusée si la capacité de l'entrepôt est dépassée.
- Une alerte est active quand `quantite <= seuilAlerte`.
- Les suppressions d'entrepôts et de produits sont refusées quand des stocks, mouvements ou affectations les utilisent.

Les erreurs API suivent le format :

```json
{
  "status": 400,
  "message": "Message métier lisible",
  "timestamp": "2026-04-21T19:00:00"
}
```

Quand une validation de formulaire échoue, le champ `errors` contient les messages par champ.

## Données de démonstration

La variable `STOCKPRO_DEMO_DATA` pilote l'initialisation :

| Valeur | Comportement |
| --- | --- |
| `false` ou absente | Crée seulement le compte `ADMIN` minimal s'il n'existe pas. Aucun entrepôt, produit, stock, mouvement ou utilisateur de démonstration n'est ajouté. |
| `true` | Crée le compte `ADMIN`, puis ajoute un jeu de données de démonstration s'il manque. Les données existantes ne sont pas supprimées. |

Comptes recommandés pour la démonstration :

| Rôle | Email | Mot de passe | Périmètre |
| --- | --- | --- | --- |
| `ADMIN` | `admin@stockpro.local` | `Admin123!` | Tous les entrepôts |
| `GESTIONNAIRE` | `gestionnaire@stockpro.local` | `Gestion123!` | Entrepôt Tunis Charguia |
| `OBSERVATEUR` | `observateur@stockpro.local` | `Observe123!` | Entrepôt Tunis Charguia |
| `GESTIONNAIRE` | `gestionnaire.sfax@stockpro.local` | `Gestion123!` | Entrepôt Sfax Poudrière |
| `OBSERVATEUR` | `observateur.sousse@stockpro.local` | `Observe123!` | Entrepôt Sousse Akouda |
| `GESTIONNAIRE` | `gestionnaire.nabeul@stockpro.local` | `Gestion123!` | Entrepôt Nabeul Mrezga |

Entrepôts de démonstration :

- Entrepôt Tunis Charguia, Zone industrielle Charguia 2, Tunis
- Entrepôt Sfax Poudrière, Route de Gabès, Sfax
- Entrepôt Sousse Akouda, Zone logistique Akouda, Sousse
- Entrepôt Nabeul Mrezga, Route touristique Mrezga, Nabeul

Familles produits retenues :

- Informatique
- Gaming
- Téléphonie
- TV
- Photo
- Son
- Électroménager

Exemples de produits chargés : `Gamer MSI Thin 15 B13UCX i5 13è Gén 24G RTX 2050`, `Apple iPhone 15 128 Go Noir`, `TV Samsung Crystal UHD 55 pouces 4K`, `Canon EOS R50 Kit 18-45mm`, `Sony WH-1000XM5 Noir`, `Lave-linge Samsung EcoBubble 9kg`.

## Scénarios de démonstration

Scénario `ADMIN` :

1. Se connecter avec `admin@stockpro.local`.
2. Vérifier le dashboard global : valeur totale, saturation, alertes, tendances et benchmark entrepôts.
3. Ouvrir Utilisateurs et confirmer les affectations par entrepôt.
4. Ouvrir Entrepôts, Produits, Stocks et Alertes pour vérifier la vision multi-entrepôts.

Scénario `GESTIONNAIRE` :

1. Se connecter avec `gestionnaire@stockpro.local`.
2. Vérifier que les listes Entrepôts, Stocks, Mouvements, Alertes et Dashboard ne contiennent que l'entrepôt Tunis Charguia.
3. Créer une entrée de stock sur son entrepôt.
4. Tenter par API directe d'envoyer un `entrepotId` d'un autre entrepôt : la requête doit être refusée.

Scénario `OBSERVATEUR` :

1. Se connecter avec `observateur@stockpro.local`.
2. Vérifier que les formulaires et actions d'écriture ne sont pas affichés.
3. Consulter dashboard, stocks, mouvements et alertes en lecture seule.
4. Tenter un `POST /api/stocks` ou `POST /api/mouvements-stock` : la requête doit être refusée.
