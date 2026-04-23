# 08 — Sécurité

| Fichier | Contenu |
|---------|---------|
| [overview.md](overview.md) | JWT, CORS, RBAC, application des règles côté backend |
| [scanning.md](scanning.md) | CodeQL, OWASP Dependency-Check, Trivy, npm audit |

## Décisions de sécurité clés

| Décision | Raison |
|----------|--------|
| JWT stateless | Pas de session serveur, compatible avec le déploiement K8s sans sticky sessions |
| RBAC appliqué côté backend | La protection ne dépend pas du frontend |
| Filtrage par entrepôt côté serveur | Impossible à contourner en modifiant l'ID dans la requête |
| Secrets hors du dépôt Git | `.env` dans `.gitignore`, bootstrap K8s manuel |
| Images Docker sans tag `latest` | Traçabilité immutable par SHA |
