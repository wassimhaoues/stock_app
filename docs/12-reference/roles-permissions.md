# Rôles et permissions

StockPro définit trois rôles applicatifs : `ADMIN`, `GESTIONNAIRE` et `OBSERVATEUR`.

## Matrice fonctionnelle

| Module | `ADMIN` | `GESTIONNAIRE` | `OBSERVATEUR` |
|--------|---------|----------------|---------------|
| Dashboard | Global multi-entrepôts | Son entrepôt | Son entrepôt |
| Utilisateurs | Créer, lire, modifier, supprimer | Aucun accès | Aucun accès |
| Entrepôts | Créer, lire, modifier, supprimer | Lire son entrepôt | Lire son entrepôt |
| Produits | Créer, lire, modifier, supprimer | Lire le catalogue | Lire le catalogue |
| Stocks | Créer, lire, modifier, supprimer | Gérer son entrepôt | Lire son entrepôt |
| Mouvements | Créer et lire | Créer et lire sur son entrepôt | Lire son entrepôt |
| Alertes | Lire toutes les alertes | Lire son entrepôt | Lire son entrepôt |
| Analytics admin | Accès complet | Aucun accès | Aucun accès |

## Périmètre par rôle

| Rôle | Périmètre de données | Affectation entrepôt |
|------|----------------------|----------------------|
| `ADMIN` | Tous les entrepôts | Optionnelle, normalement `null` |
| `GESTIONNAIRE` | Entrepôt affecté uniquement | Obligatoire |
| `OBSERVATEUR` | Entrepôt affecté uniquement | Obligatoire |

Le filtrage par entrepôt est appliqué côté backend. Modifier manuellement `entrepotId` dans une requête ne permet pas de sortir de son périmètre.

## Règles backend

| Ressource | Lecture | Écriture |
|-----------|---------|----------|
| `/api/utilisateurs/**` | `ADMIN` | `ADMIN` |
| `/api/entrepots/**` | Tous les rôles, avec filtrage pour non-admin | `ADMIN` |
| `/api/produits/**` | Tous les rôles | `ADMIN` |
| `/api/stocks/**` | Tous les rôles, avec filtrage pour non-admin | `ADMIN`, `GESTIONNAIRE` |
| `/api/mouvements-stock/**` | Tous les rôles, avec filtrage pour non-admin | `ADMIN`, `GESTIONNAIRE` |
| `/api/alertes` | Tous les rôles, avec filtrage pour non-admin | Aucune écriture exposée |
| `/api/dashboard/admin/**` | `ADMIN` | Aucune écriture exposée |
| `/api/dashboard/**` | Tous les rôles, avec filtrage pour non-admin | Aucune écriture exposée |

## Cas de refus attendus

| Action | Résultat attendu |
|--------|------------------|
| `OBSERVATEUR` tente `POST /api/stocks` | `403 Acces refuse` |
| `GESTIONNAIRE` crée un stock dans un autre entrepôt | `403 Acces refuse` |
| Non-admin consulte un stock hors périmètre | `404 Stock introuvable` |
| Non-admin sans entrepôt affecté consulte les stocks | `400 Aucun entrepot n'est affecte a ce compte` |
| `GESTIONNAIRE` appelle `/api/dashboard/admin/analytics` | `403 Acces refuse` |

## CSRF et cookie d'authentification

Le frontend ne stocke pas le JWT dans `localStorage`. La session repose sur :

| Élément | Valeur par défaut | Rôle |
|---------|-------------------|------|
| Cookie JWT | `STOCKPRO_AUTH` | Cookie HTTP-only qui porte le JWT |
| Cookie CSRF | `XSRF-TOKEN` | Cookie lisible par le frontend |
| Header CSRF | `X-XSRF-TOKEN` | Header envoyé sur les requêtes mutatives |

Pour initialiser la protection CSRF avant la connexion, le frontend appelle `GET /api/auth/csrf`, puis `POST /api/auth/login`.
