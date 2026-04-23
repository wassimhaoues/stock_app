# Sécurité applicative

## Authentification JWT

L'application utilise des tokens JWT stateless (pas de session serveur).

### Flux d'authentification

```
Client → GET /api/auth/csrf
       ← 204 + cookie XSRF-TOKEN

Client → POST /api/auth/login {email, motDePasse}
       ← 200 {utilisateur: {...}} + cookie STOCKPRO_AUTH

Client → GET /api/stocks
         Cookie: STOCKPRO_AUTH=...
       ← 200 [...]
```

Le frontend ne persiste pas le JWT dans `localStorage`. Pour les tests API directs, le backend accepte aussi un JWT transmis par `Authorization: Bearer <token>`.

### Configuration JWT

| Paramètre | Variable | Défaut |
|-----------|----------|--------|
| Clé de signature | `JWT_SECRET` | Valeur dev non sécurisée — **toujours remplacer en production** |
| Durée de vie | `JWT_EXPIRATION` | `86400000` ms (24h) |
| Cookie auth | `STOCKPRO_AUTH` | Chemin `/api`, SameSite Lax |

### Rotation de clé JWT

Changer `JWT_SECRET` invalide tous les tokens existants. Les utilisateurs connectés doivent se reconnecter.

## Contrôle d'accès basé sur les rôles (RBAC)

### Trois rôles

| Rôle | Périmètre | Droits |
|------|-----------|--------|
| `ADMIN` | Global (tous les entrepôts) | CRUD complet sur tous les modules + gestion utilisateurs |
| `GESTIONNAIRE` | Son entrepôt affecté uniquement | CRUD stocks et mouvements dans son entrepôt |
| `OBSERVATEUR` | Son entrepôt affecté uniquement | Lecture seule |

### Application côté backend

Le contrôle d'accès est appliqué dans la couche service, pas uniquement dans les endpoints. Les vérifications sont effectuées à partir de l'utilisateur authentifié (`@AuthenticationPrincipal`), pas depuis les paramètres de la requête.

**Exemple : `GESTIONNAIRE` ne peut pas accéder à un entrepôt non affecté**

Si un `GESTIONNAIRE` envoie `GET /api/stocks?entrepotId=2` alors que son entrepôt affecté est `1` :
- Le backend filtre les résultats pour ne retourner que les stocks de l'entrepôt `1`
- Une tentative d'écriture sur l'entrepôt `2` retourne `403 Forbidden`

**Endpoints utilisateurs**

`/api/utilisateurs/**` est protégé par `hasRole("ADMIN")`. Les `GESTIONNAIRE` et `OBSERVATEUR` reçoivent `403` sur tout accès à ces endpoints.

## CORS

La configuration CORS est gérée par `CorsConfig` et contrôlée par la variable `CORS_ALLOWED_ORIGINS`.

| Environnement | Valeur |
|---------------|--------|
| Développement local | `http://localhost:4200` |
| Kubernetes local | `http://localhost:30080` |
| Docker Compose | non requis (le frontend proxy via nginx) |

Les méthodes autorisées : `GET, POST, PUT, DELETE, OPTIONS`

Les headers autorisés sont ouverts côté CORS (`*`) et les credentials sont autorisés pour transporter les cookies d'authentification.

## Gestion des secrets

| Environnement | Mécanisme |
|---------------|-----------|
| Docker Compose local | Fichier `.env` (dans `.gitignore`) |
| Kubernetes local | Secret généré par Kustomize depuis `k8s/overlays/local/.env` (gitignore) |
| Kubernetes GitOps | Secret bootstrap créé manuellement une seule fois |
| GitHub Actions | GitHub Secrets (chiffrés, jamais visibles dans les logs) |

**Règle absolue :** aucun secret (mot de passe, clé JWT, token) ne doit jamais être commité dans le dépôt Git.

## Format des erreurs de sécurité

Refus d'authentification :
```json
{"status": 401, "message": "Authentification requise"}
```

Accès non autorisé :
```json
{"status": 403, "message": "Acces refuse"}
```
