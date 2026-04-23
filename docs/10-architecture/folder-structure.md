# Structure du dépôt

```
stock-management/
├── .github/
│   └── workflows/
│       ├── ci.yml              CI : tests backend, frontend, SonarCloud
│       ├── cd.yml              CD : build GHCR, bump GitOps
│       └── security.yml        Scans : CodeQL, OWASP, Trivy
│
├── backend/                    Application Spring Boot
│   ├── Dockerfile              Multi-stage : Maven build → JRE 17 runtime
│   ├── .dockerignore
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd         Maven wrapper (pas besoin d'installer Maven)
│   └── src/
│       ├── main/java/com/wassim/stock/
│       │   ├── config/         CorsConfig, SecurityConfig, DataInitializer
│       │   ├── controller/     Endpoints REST (Auth, Health, Entrepots, Produits…)
│       │   ├── dto/            Objets de transfert (requêtes/réponses API)
│       │   ├── entity/         Entités JPA (Utilisateur, Entrepot, Produit…)
│       │   ├── exception/      GlobalExceptionHandler, exceptions métier
│       │   ├── repository/     Interfaces Spring Data JPA
│       │   ├── security/       JwtUtil, JwtAuthFilter, UserDetailsServiceImpl
│       │   └── service/        Logique métier et règles d'accès
│       ├── main/resources/
│       │   ├── application.properties      Profil par défaut (dev)
│       │   ├── application-dev.properties  Base MySQL localhost
│       │   └── application-docker.properties  Base MySQL stock-db (conteneur)
│       └── test/               Tests unitaires et d'intégration
│
├── frontend/                   Application Angular
│   ├── Dockerfile              Multi-stage : Node build → nginx runtime
│   ├── .dockerignore
│   ├── nginx.conf              SPA routing + proxy /api/ → backend
│   ├── package.json
│   ├── angular.json
│   ├── vitest.config.ts
│   └── src/app/
│       ├── core/               AuthService, intercepteurs, guards, modèles
│       ├── features/           Modules par domaine (auth, dashboard, entrepots…)
│       ├── shared/             Composants, pipes, directives réutilisables
│       ├── layout/             AppShell, sidebar, header
│       └── app.routes.ts       Routes avec lazy loading
│
├── infra/
│   ├── docker-compose.yml      phpMyAdmin uniquement (outil d'administration DB)
│   └── mysql-init/
│       └── 01-schema.sql       Schéma SQL — source de vérité unique pour la base
│
├── k8s/
│   ├── base/                   Manifests communs (namespace, mysql, backend, frontend)
│   │   ├── namespace.yaml
│   │   ├── kustomization.yaml
│   │   ├── assets/01-schema.sql    Copie du schéma pour le ConfigMap Kustomize
│   │   ├── backend/            configmap.yaml, deployment.yaml, service.yaml
│   │   ├── frontend/           deployment.yaml, service.yaml
│   │   └── mysql/              deployment.yaml, pvc.yaml, service.yaml
│   ├── overlays/
│   │   ├── local/              Overlay kind : secretGenerator, images locales
│   │   │   ├── kustomization.yaml
│   │   │   ├── kind-cluster.yaml
│   │   │   ├── .env            Secrets (gitignore)
│   │   │   ├── .env.example    Template
│   │   │   └── patches/expose-services.yaml  NodePort 30080/30085
│   │   └── gitops/             Overlay ArgoCD : images GHCR, tag SHA
│   │       ├── kustomization.yaml  (mis à jour automatiquement par CD)
│   │       └── patches/expose-services.yaml
│   └── argocd/
│       ├── namespace.yaml      Namespace argocd
│       └── stockpro-app.yaml   Application ArgoCD
│
├── docs/                       Documentation technique (ce dossier)
│
├── docker-compose.yml          Stack applicative : MySQL + Backend + Frontend
├── .env.example                Template des variables d'environnement
├── .env                        Secrets locaux (gitignore — ne pas committer)
├── .gitignore
├── sonar-project.properties    Configuration SonarCloud
└── README.md                   Point d'entrée principal
```

## Fichiers importants

| Fichier | Rôle |
|---------|------|
| `.env.example` | Template à copier en `.env` avant le premier lancement |
| `infra/mysql-init/01-schema.sql` | Source de vérité du schéma MySQL — toujours mettre à jour ce fichier lors d'un changement de schéma |
| `k8s/overlays/gitops/kustomization.yaml` | Mis à jour automatiquement par le pipeline CD avec le tag d'image SHA |
| `sonar-project.properties` | Configuration SonarCloud (chemins des sources, rapports de couverture) |

## Fichiers dans .gitignore

| Fichier / Dossier | Raison |
|-------------------|--------|
| `.env` | Contient les secrets — ne jamais committer |
| `k8s/overlays/local/.env` | Secrets Kubernetes locaux |
| `backend/target/` | Artefacts Maven |
| `frontend/dist/` | Build Angular |
| `frontend/node_modules/` | Dépendances npm |
| `frontend/coverage/` | Rapports de couverture |
