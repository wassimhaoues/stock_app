# Documentation StockPro

Bienvenue dans la documentation technique de StockPro, une application web de gestion de stocks multi-entrepôts construite avec Spring Boot 4.0.5 et Angular.

## Navigation

| Section | Description |
|---------|-------------|
| [01 — Démarrage](01-getting-started/) | Prérequis, configuration locale, variables d'environnement |
| [02 — Développement](02-development/) | Lancer le backend et le frontend en mode développement |
| [03 — Docker](03-docker/) | Utiliser la stack Docker Compose |
| [04 — Kubernetes](04-kubernetes/) | Déploiement local avec kind |
| [05 — GitOps](05-gitops/) | ArgoCD, synchronisation et flux GitOps |
| [06 — CI/CD](06-ci-cd/) | Pipelines GitHub Actions, quality gates et publication d'images |
| [07 — Tests](07-testing/) | Tests backend (JUnit) et frontend (Vitest) |
| [08 — Sécurité](08-security/) | JWT, CORS, RBAC, scans de vulnérabilités |
| [09 — Opérations](09-operations/) | Dépannage, erreurs fréquentes, récupération |
| [10 — Architecture](10-architecture/) | Vue d'ensemble technique, structure du dépôt |
| [11 — Gestion de projet](11-project-management/) | Feuille de route, phases, backlog |
| [12 — Référence](12-reference/) | API REST, comptes de démo, matrice des rôles |

## Démarrage rapide

La méthode la plus simple pour lancer l'application complète :

```bash
# 1. Cloner le dépôt
git clone https://github.com/wassimhaoues/stock_app.git
cd stock_app

# 2. Configurer les secrets
cp .env.example .env
# Éditer .env avec les mots de passe souhaités

# 3. Démarrer toute la stack
docker compose up -d

# 4. Ouvrir l'application
# Frontend : http://localhost:4200
# Backend  : http://localhost:8085/api/health
# Swagger  : http://localhost:8085/swagger-ui.html
```

Comptes disponibles avec `STOCKPRO_DEMO_DATA=true` :

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| `admin@stockpro.local` | `Admin123!` | ADMIN |
| `gestionnaire@stockpro.local` | `Gestion123!` | GESTIONNAIRE |
| `observateur@stockpro.local` | `Observe123!` | OBSERVATEUR |

Voir [01 — Démarrage](01-getting-started/local-setup.md) pour le guide complet.
