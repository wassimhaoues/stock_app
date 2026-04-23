# Vue d'ensemble de l'architecture

## Stack technique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Backend | Spring Boot | 4.0.5 |
| Langage backend | Java | 17 |
| Frontend | Angular + Angular Material | 21 |
| Base de données | MySQL | 8.0 |
| Authentification | JWT (Spring Security) | — |
| Documentation API | SpringDoc OpenAPI (Swagger) | — |
| Tests backend | JUnit 5 + Mockito + MockMvc | — |
| Tests frontend | Vitest + jsdom | — |
| Conteneurisation | Docker + Docker Compose | — |
| Orchestration | Kubernetes (kind en local) | — |
| GitOps | ArgoCD | — |
| Registry d'images | GitHub Container Registry (GHCR) | — |
| CI/CD | GitHub Actions | — |
| Qualité | SonarCloud | — |
| SAST | GitHub CodeQL | — |

## Architecture applicative

```
┌─────────────────────────────────────────────────────────┐
│                    Navigateur web                        │
│              http://localhost:4200 (local)               │
│              http://localhost:30080 (K8s)                │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP
                            ▼
┌─────────────────────────────────────────────────────────┐
│               Frontend — Angular + nginx                 │
│                                                          │
│  - Composants Angular Material                           │
│  - Routing lazy-loaded par fonctionnalité               │
│  - Intercepteur HTTP avec credentials cookie JWT        │
│  - Guards par rôle (AuthGuard, RoleGuard)               │
│  - Proxy /api/ → backend                                │
│                                                          │
│  Port : 80 (conteneur) / 4200 (Docker) / 30080 (K8s)   │
└───────────────────────────┬─────────────────────────────┘
                            │ /api/* proxied
                            ▼
┌─────────────────────────────────────────────────────────┐
│              Backend — Spring Boot 4.0.5                 │
│                                                          │
│  - REST API (contrôleurs, services, repositories)       │
│  - Spring Security + JwtAuthFilter                      │
│  - RBAC : ADMIN / GESTIONNAIRE / OBSERVATEUR            │
│  - Filtrage par entrepôt côté service                   │
│  - Swagger UI sur /swagger-ui.html                      │
│  - DataInitializer : données de démo au démarrage       │
│                                                          │
│  Port : 8085 (Docker) / 30085 (K8s)                     │
└───────────────────────────┬─────────────────────────────┘
                            │ JDBC
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  MySQL 8.0                               │
│                                                          │
│  Tables : utilisateurs, entrepots, produits,            │
│           stocks, mouvement_stock                        │
│  Schéma : infra/mysql-init/01-schema.sql                │
│                                                          │
│  Port : 3306 (interne) / 3307 (Docker hôte)             │
└─────────────────────────────────────────────────────────┘
```

## Architecture CI/CD

```
Push / PR
    │
    ▼
┌──────────────────────────────────┐
│         CI (ci.yml)              │
│                                  │
│  ┌─────────┐  ┌──────────────┐  │
│  │ backend │  │  frontend    │  │
│  │ tests   │  │  tests       │  │
│  │ build   │  │  lint        │  │
│  └────┬────┘  └──────┬───────┘  │
│       │              │          │
│       └──────┬───────┘          │
│              ▼                  │
│       ┌─────────────┐           │
│       │ SonarCloud  │           │
│       │ Quality Gate│           │
│       └─────────────┘           │
└──────────────────────────────────┘
    │ (sur main uniquement)
    ▼
┌──────────────────────────────────┐
│         CD (cd.yml)              │
│                                  │
│  detect-changes                  │
│       │                          │
│  ┌────┴──────┐                  │
│  ▼           ▼                  │
│ build-    build-                 │
│ backend   frontend               │
│  │           │                  │
│  └────┬──────┘                  │
│       ▼                          │
│  gitops-bump                     │
│  (kustomize + SSH push)          │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│     ArgoCD auto-sync             │
│     (k8s/overlays/gitops)        │
└──────────────────────────────────┘
```

## Architecture Kubernetes

```
Namespace: stockpro
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │ Deployment       │  │ Deployment       │              │
│  │ stock-frontend   │  │ stock-backend    │              │
│  │ (nginx)          │  │ (Spring Boot)    │              │
│  │                  │  │                  │              │
│  │ Service NodePort │  │ Service NodePort │              │
│  │ :30080           │  │ :30085           │              │
│  └─────────────────┘  └────────┬─────────┘              │
│                                │ ClusterIP stock-db:3306  │
│                       ┌────────▼─────────┐              │
│                       │ Deployment        │              │
│                       │ stock-db (MySQL)  │              │
│                       │                  │              │
│                       │ Service ClusterIP│              │
│                       │ stock-db:3306    │              │
│                       │                  │              │
│                       │ PVC mysql-pvc 2Gi│              │
│                       └──────────────────┘              │
│                                                          │
│  Secret: stockpro-secrets (bootstrap manuel)            │
│  ConfigMap: backend-config (variables non sensibles)    │
│  ConfigMap: mysql-init-sql (schéma SQL)                 │
└──────────────────────────────────────────────────────────┘
```

## Modèle de données

| Table | Description |
|-------|-------------|
| `utilisateurs` | Comptes utilisateurs avec rôle et entrepôt affecté |
| `entrepots` | Entrepôts avec capacité maximale |
| `produits` | Catalogue produits global |
| `stocks` | Quantités par couple produit/entrepôt (unique) |
| `mouvement_stock` | Historique des entrées/sorties |
| `alertes` | Stocks où `quantite <= seuilAlerte` (calculé dynamiquement) |

La capacité d'entrepôt est calculée dynamiquement depuis la somme des quantités de stocks existants — elle n'est pas stockée comme valeur persistante.
