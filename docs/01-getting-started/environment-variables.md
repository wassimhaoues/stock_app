# Variables d'environnement

## Fichier `.env` (racine)

Ce fichier est lu par `docker-compose.yml`. Copier `.env.example` en `.env` et renseigner les valeurs réelles.

```bash
cp .env.example .env
```

### Variables MySQL

| Variable | Exemple | Description |
|----------|---------|-------------|
| `MYSQL_ROOT_PASSWORD` | `root_secret` | Mot de passe du compte root MySQL. Utilisé uniquement en interne par le conteneur. |
| `MYSQL_DATABASE` | `stock_app_db` | Nom de la base créée au premier démarrage du volume. |
| `MYSQL_USER` | `stockpro` | Compte applicatif utilisé par le backend Spring Boot. |
| `MYSQL_PASSWORD` | `app_secret` | Mot de passe du compte applicatif. |

### Variables Backend

| Variable | Exemple | Requis | Description |
|----------|---------|--------|-------------|
| `JWT_SECRET` | _(base64, 32+ chars)_ | Oui | Clé de signature des tokens JWT. Générer avec `openssl rand -base64 32`. |
| `STOCKPRO_DEMO_DATA` | `true` | Non | `true` : charge le jeu de données de démo tunisien. `false` : base vide avec le compte admin seulement. Par défaut `true` si absent. |

---

## Variables backend complètes (application.properties)

Ces variables peuvent être surchargées via l'environnement ou un fichier `.env` injecté au démarrage.

| Variable | Valeur par défaut | Description |
|----------|-------------------|-------------|
| `DB_HOST` | `localhost` | Hôte MySQL. Docker Compose définit `stock-db`. |
| `DB_PORT` | `3306` | Port MySQL. |
| `DB_NAME` | `stock_app_db` | Nom de la base. |
| `DB_USERNAME` | — | Utilisateur MySQL. Requis en production. |
| `DB_PASSWORD` | — | Mot de passe MySQL. Requis en production. |
| `JWT_SECRET` | _(valeur dev non sécurisée)_ | **Toujours remplacer en production.** |
| `JWT_EXPIRATION` | `86400000` | Durée de vie du token en millisecondes (24h). |
| `STOCKPRO_DEMO_DATA` | `true` | Activer/désactiver les données de démo. |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4200` | Origines autorisées pour les requêtes CORS. En K8s : `http://localhost:30080`. |
| `SERVER_PORT` | `8085` | Port d'écoute du backend. |

---

## Variables Kubernetes (overlay local)

Fichier `k8s/overlays/local/.env` (non versionné, copier depuis `.env.example`) :

```bash
cp k8s/overlays/local/.env.example k8s/overlays/local/.env
```

Les variables ont la même signification que le fichier `.env` racine. Le Secret `stockpro-secrets` est généré automatiquement par Kustomize depuis ce fichier.

---

## Variables Kubernetes (overlay GitOps)

L'overlay GitOps ne lit pas de fichier `.env`. Le Secret `stockpro-secrets` est créé **manuellement une seule fois** avant la première synchronisation ArgoCD :

```bash
kubectl create secret generic stockpro-secrets \
  --from-env-file=.env \
  -n stockpro
```

Ce secret n'est jamais modifié par le pipeline CD. Voir [05-gitops/bootstrap.md](../05-gitops/bootstrap.md) pour le détail.

---

## GitHub Secrets (CI/CD)

Ces secrets sont configurés dans **Settings → Secrets and variables → Actions** du dépôt GitHub.

| Secret | Requis par | Description |
|--------|-----------|-------------|
| `SONAR_TOKEN` | CI (`ci.yml`) | Token d'authentification SonarCloud. |
| `JWT_SECRET` | CI (`ci.yml`) | Clé JWT pour les tests d'intégration backend. |
| `NVD_API_KEY` | Security (`security.yml`) | Optionnel. Accélère le téléchargement de la base NVD pour OWASP Dependency-Check. |
| `SSH_PRIVATE_KEY` | CD (`cd.yml`) | Clé privée SSH pour que le pipeline puisse pousser le commit GitOps sur `main`. |

Voir [06-ci-cd/secrets.md](../06-ci-cd/secrets.md) pour la procédure de configuration.
