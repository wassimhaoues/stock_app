# 12 — Référence

Cette section regroupe les informations stables à consulter pendant le développement, les tests API, les démonstrations et la soutenance.

| Fichier | Contenu |
|---------|---------|
| [api-rest.md](api-rest.md) | Base URL, authentification, endpoints REST, payloads, formats d'erreur |
| [roles-permissions.md](roles-permissions.md) | Matrice des rôles, périmètres par entrepôt, règles d'accès backend |
| [demo-data.md](demo-data.md) | Comptes de démonstration, entrepôts, produits, scénarios de validation |
| [data-model.md](data-model.md) | Modèle relationnel, contraintes SQL, règles métier transverses |

## Points d'entrée rapides

| Ressource | URL locale |
|-----------|------------|
| Frontend | `http://localhost:4200` |
| API backend | `http://localhost:8085` |
| Health check | `http://localhost:8085/api/health` |
| Swagger UI | `http://localhost:8085/swagger-ui.html` |
| OpenAPI JSON | `http://localhost:8085/v3/api-docs` |
| phpMyAdmin | `http://localhost:8084` |

## Authentification API

Le frontend utilise un cookie HTTP-only nommé `STOCKPRO_AUTH` et un jeton CSRF `XSRF-TOKEN`.

Pour les tests API directs, il est aussi possible d'envoyer le JWT dans l'en-tête :

```http
Authorization: Bearer <token>
```

Toutes les routes `/api/**` sont protégées sauf :

- `GET /api/health`
- `GET /api/auth/csrf`
- `POST /api/auth/login`
- `/swagger-ui/**`
- `/swagger-ui.html`
- `/v3/api-docs/**`

## Références principales

- Pour la configuration locale complète : [01 — Démarrage](../01-getting-started/).
- Pour la sécurité JWT, CORS et CSRF : [08 — Sécurité](../08-security/).
- Pour l'architecture technique : [10 — Architecture](../10-architecture/).
