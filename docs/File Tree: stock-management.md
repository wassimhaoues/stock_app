# File Tree: stock-management

**Generated:** 4/23/2026, 2:23:19 PM
**Root Path:** `/home/coworky/Study/JEE/stock-management`

```
├── 📁 .github
│   └── 📁 workflows
│       ├── ⚙️ cd.yml
│       ├── ⚙️ ci.yml
│       └── ⚙️ security.yml
├── 📁 backend
│   ├── 📁 .mvn
│   │   └── 📁 wrapper
│   │       └── 📄 maven-wrapper.properties
│   ├── 📁 src
│   │   ├── 📁 main
│   │   │   ├── 📁 java
│   │   │   │   └── 📁 com
│   │   │   │       └── 📁 wassim
│   │   │   │           └── 📁 stock
│   │   │   │               ├── 📁 config
│   │   │   │               │   ├── 📁 properties
│   │   │   │               │   │   ├── ☕ AuthCookieProperties.java
│   │   │   │               │   │   ├── ☕ CorsProperties.java
│   │   │   │               │   │   ├── ☕ JwtProperties.java
│   │   │   │               │   │   └── ☕ StockProProperties.java
│   │   │   │               │   ├── ☕ CorsConfig.java
│   │   │   │               │   ├── ☕ DataInitializer.java
│   │   │   │               │   ├── ☕ SecurityConfig.java
│   │   │   │               │   └── ☕ TimeConfig.java
│   │   │   │               ├── 📁 controller
│   │   │   │               │   ├── ☕ AlerteController.java
│   │   │   │               │   ├── ☕ AuthController.java
│   │   │   │               │   ├── ☕ DashboardController.java
│   │   │   │               │   ├── ☕ EntrepotController.java
│   │   │   │               │   ├── ☕ HealthController.java
│   │   │   │               │   ├── ☕ MouvementStockController.java
│   │   │   │               │   ├── ☕ ProduitController.java
│   │   │   │               │   ├── ☕ StockController.java
│   │   │   │               │   └── ☕ UtilisateurController.java
│   │   │   │               ├── 📁 dto
│   │   │   │               │   ├── 📁 request
│   │   │   │               │   │   ├── ☕ EntrepotRequest.java
│   │   │   │               │   │   ├── ☕ LoginRequest.java
│   │   │   │               │   │   ├── ☕ MouvementStockRequest.java
│   │   │   │               │   │   ├── ☕ ProduitRequest.java
│   │   │   │               │   │   ├── ☕ StockRequest.java
│   │   │   │               │   │   └── ☕ UtilisateurRequest.java
│   │   │   │               │   └── 📁 response
│   │   │   │               │       ├── ☕ AdminAnalyticsResponse.java
│   │   │   │               │       ├── ☕ AlerteResponse.java
│   │   │   │               │       ├── ☕ AuthResponse.java
│   │   │   │               │       ├── ☕ DashboardAnalyticsResponse.java
│   │   │   │               │       ├── ☕ DashboardKpisResponse.java
│   │   │   │               │       ├── ☕ DashboardStatsResponse.java
│   │   │   │               │       ├── ☕ EntrepotResponse.java
│   │   │   │               │       ├── ☕ MouvementStockResponse.java
│   │   │   │               │       ├── ☕ ProduitResponse.java
│   │   │   │               │       ├── ☕ StockResponse.java
│   │   │   │               │       └── ☕ UtilisateurResponse.java
│   │   │   │               ├── 📁 entity
│   │   │   │               │   ├── ☕ Entrepot.java
│   │   │   │               │   ├── ☕ MouvementStock.java
│   │   │   │               │   ├── ☕ Produit.java
│   │   │   │               │   ├── ☕ Role.java
│   │   │   │               │   ├── ☕ Stock.java
│   │   │   │               │   ├── ☕ TypeMouvement.java
│   │   │   │               │   └── ☕ Utilisateur.java
│   │   │   │               ├── 📁 exception
│   │   │   │               │   ├── ☕ BadRequestException.java
│   │   │   │               │   ├── ☕ ConflictException.java
│   │   │   │               │   ├── ☕ GlobalExceptionHandler.java
│   │   │   │               │   └── ☕ ResourceNotFoundException.java
│   │   │   │               ├── 📁 repository
│   │   │   │               │   ├── ☕ EntrepotRepository.java
│   │   │   │               │   ├── ☕ MouvementStockRepository.java
│   │   │   │               │   ├── ☕ ProduitRepository.java
│   │   │   │               │   ├── ☕ StockRepository.java
│   │   │   │               │   └── ☕ UtilisateurRepository.java
│   │   │   │               ├── 📁 security
│   │   │   │               │   ├── ☕ JwtAuthFilter.java
│   │   │   │               │   ├── ☕ JwtUtil.java
│   │   │   │               │   └── ☕ UserDetailsServiceImpl.java
│   │   │   │               ├── 📁 service
│   │   │   │               │   ├── ☕ AlerteService.java
│   │   │   │               │   ├── ☕ AuthService.java
│   │   │   │               │   ├── ☕ DashboardService.java
│   │   │   │               │   ├── ☕ EntrepotService.java
│   │   │   │               │   ├── ☕ MouvementStockService.java
│   │   │   │               │   ├── ☕ ProduitService.java
│   │   │   │               │   ├── ☕ StockService.java
│   │   │   │               │   └── ☕ UtilisateurService.java
│   │   │   │               └── ☕ StockBackendApplication.java
│   │   │   └── 📁 resources
│   │   │       ├── 📁 static
│   │   │       ├── 📁 templates
│   │   │       ├── 📄 application-dev.properties
│   │   │       ├── 📄 application-docker.properties
│   │   │       └── 📄 application.properties
│   │   └── 📁 test
│   │       ├── 📁 java
│   │       │   └── 📁 com
│   │       │       └── 📁 wassim
│   │       │           └── 📁 stock
│   │       │               ├── 📁 controller
│   │       │               │   └── ☕ BackendSecurityIntegrationTest.java
│   │       │               ├── 📁 service
│   │       │               │   ├── ☕ AlerteServiceTest.java
│   │       │               │   ├── ☕ AuthServiceTest.java
│   │       │               │   ├── ☕ DashboardServiceTest.java
│   │       │               │   ├── ☕ EntrepotServiceTest.java
│   │       │               │   ├── ☕ MouvementStockServiceTest.java
│   │       │               │   ├── ☕ ProduitServiceTest.java
│   │       │               │   ├── ☕ StockServiceTest.java
│   │       │               │   └── ☕ UtilisateurServiceTest.java
│   │       │               └── ☕ StockBackendApplicationTests.java
│   │       └── 📁 resources
│   │           ├── 📁 mockito-extensions
│   │           │   └── 📄 org.mockito.plugins.MockMaker
│   │           └── 📄 application-test.properties
│   ├── ⚙️ .dockerignore
│   ├── ⚙️ .gitattributes
│   ├── ⚙️ .gitignore
│   ├── 🐳 Dockerfile
│   ├── 📝 HELP.md
│   ├── 📄 mvnw
│   ├── 📄 mvnw.cmd
│   └── ⚙️ pom.xml
├── 📁 docs
│   ├── 📁 agile
│   │   ├── 📝 Projet_DevOps.md
│   │   ├── 📝 product-backlog.md
│   │   └── 📝 roadmap-grandes-taches.md
│   ├── 📝 API.md
│   ├── 📝 Folder_structure.md
│   ├── 📝 local-kubernities-steps.md
│   ├── 📝 phase-17-manual-steps.md
│   ├── 📝 phase-18-cd-automation.md
│   └── 📝 quality-gates.md
├── 📁 frontend
│   ├── 📁 public
│   │   └── 📄 favicon.ico
│   ├── 📁 src
│   │   ├── 📁 app
│   │   │   ├── 📁 core
│   │   │   │   ├── 📁 guards
│   │   │   │   │   ├── 📄 auth-guards.spec.ts
│   │   │   │   │   ├── 📄 auth.guard.ts
│   │   │   │   │   ├── 📄 guest.guard.ts
│   │   │   │   │   └── 📄 role.guard.ts
│   │   │   │   ├── 📁 interceptors
│   │   │   │   │   ├── 📄 jwt.interceptor.spec.ts
│   │   │   │   │   └── 📄 jwt.interceptor.ts
│   │   │   │   ├── 📁 models
│   │   │   │   │   ├── 📄 alerte.model.ts
│   │   │   │   │   ├── 📄 auth-response.model.ts
│   │   │   │   │   ├── 📄 dashboard.model.ts
│   │   │   │   │   ├── 📄 entrepot-request.model.ts
│   │   │   │   │   ├── 📄 entrepot.model.ts
│   │   │   │   │   ├── 📄 health-status.model.ts
│   │   │   │   │   ├── 📄 login-request.model.ts
│   │   │   │   │   ├── 📄 mouvement-stock-request.model.ts
│   │   │   │   │   ├── 📄 mouvement-stock.model.ts
│   │   │   │   │   ├── 📄 produit-request.model.ts
│   │   │   │   │   ├── 📄 produit.model.ts
│   │   │   │   │   ├── 📄 role.model.ts
│   │   │   │   │   ├── 📄 stock-request.model.ts
│   │   │   │   │   ├── 📄 stock.model.ts
│   │   │   │   │   ├── 📄 type-mouvement.model.ts
│   │   │   │   │   ├── 📄 utilisateur-request.model.ts
│   │   │   │   │   └── 📄 utilisateur.model.ts
│   │   │   │   └── 📁 services
│   │   │   │       ├── 📄 alerte.service.ts
│   │   │   │       ├── 📄 api-services.spec.ts
│   │   │   │       ├── 📄 auth.service.spec.ts
│   │   │   │       ├── 📄 auth.service.ts
│   │   │   │       ├── 📄 dashboard.service.ts
│   │   │   │       ├── 📄 entrepot.service.ts
│   │   │   │       ├── 📄 health.service.ts
│   │   │   │       ├── 📄 mouvement-stock.service.ts
│   │   │   │       ├── 📄 produit.service.ts
│   │   │   │       ├── 📄 stock.service.ts
│   │   │   │       └── 📄 utilisateur.service.ts
│   │   │   ├── 📁 features
│   │   │   │   ├── 📁 alertes
│   │   │   │   │   ├── 📄 alertes-page.component.spec.ts
│   │   │   │   │   └── 📄 alertes-page.component.ts
│   │   │   │   ├── 📁 auth
│   │   │   │   │   ├── 📄 login-page.component.spec.ts
│   │   │   │   │   └── 📄 login-page.component.ts
│   │   │   │   ├── 📁 entrepots
│   │   │   │   │   ├── 📄 entrepots-page.component.spec.ts
│   │   │   │   │   └── 📄 entrepots-page.component.ts
│   │   │   │   ├── 📁 home
│   │   │   │   │   ├── 📄 home-page.component.spec.ts
│   │   │   │   │   └── 📄 home-page.component.ts
│   │   │   │   ├── 📁 produits
│   │   │   │   │   ├── 📄 produits-page.component.spec.ts
│   │   │   │   │   └── 📄 produits-page.component.ts
│   │   │   │   ├── 📁 stocks
│   │   │   │   │   ├── 📄 stocks-page.component.spec.ts
│   │   │   │   │   └── 📄 stocks-page.component.ts
│   │   │   │   └── 📁 utilisateurs
│   │   │   │       ├── 📄 utilisateurs-page.component.spec.ts
│   │   │   │       └── 📄 utilisateurs-page.component.ts
│   │   │   ├── 📁 shared
│   │   │   │   ├── 📁 components
│   │   │   │   │   └── 📁 confirm-dialog
│   │   │   │   │       └── 📄 confirm-dialog.component.ts
│   │   │   │   └── 📁 layout
│   │   │   │       ├── 📁 header
│   │   │   │       │   └── 📄 header.component.ts
│   │   │   │       ├── 📁 main-layout
│   │   │   │       │   └── 📄 main-layout.component.ts
│   │   │   │       ├── 📁 sidebar
│   │   │   │       │   └── 📄 sidebar.component.ts
│   │   │   │       └── 📄 layout-components.spec.ts
│   │   │   ├── 📄 app.config.ts
│   │   │   ├── 🌐 app.html
│   │   │   ├── 📄 app.routes.ts
│   │   │   ├── 🎨 app.scss
│   │   │   ├── 📄 app.spec.ts
│   │   │   └── 📄 app.ts
│   │   ├── 🌐 index.html
│   │   ├── 📄 main.ts
│   │   └── 🎨 styles.scss
│   ├── ⚙️ .dockerignore
│   ├── ⚙️ .editorconfig
│   ├── ⚙️ .gitignore
│   ├── ⚙️ .prettierrc
│   ├── 🐳 Dockerfile
│   ├── 📝 README.md
│   ├── ⚙️ angular.json
│   ├── ⚙️ nginx.conf
│   ├── ⚙️ package-lock.json
│   ├── ⚙️ package.json
│   ├── ⚙️ proxy.conf.json
│   ├── ⚙️ tsconfig.app.json
│   ├── ⚙️ tsconfig.json
│   └── ⚙️ tsconfig.spec.json
├── 📁 infra
│   ├── 📁 mysql-init
│   │   └── 📄 01-schema.sql
│   └── ⚙️ docker-compose.yml
├── 📁 k8s
│   ├── 📁 argocd
│   │   ├── ⚙️ namespace.yaml
│   │   └── ⚙️ stockpro-app.yaml
│   ├── 📁 base
│   │   ├── 📁 assets
│   │   │   └── 📄 01-schema.sql
│   │   ├── 📁 backend
│   │   │   ├── ⚙️ configmap.yaml
│   │   │   ├── ⚙️ deployment.yaml
│   │   │   └── ⚙️ service.yaml
│   │   ├── 📁 frontend
│   │   │   ├── ⚙️ deployment.yaml
│   │   │   └── ⚙️ service.yaml
│   │   ├── 📁 mysql
│   │   │   ├── ⚙️ deployment.yaml
│   │   │   ├── ⚙️ pvc.yaml
│   │   │   └── ⚙️ service.yaml
│   │   ├── ⚙️ kustomization.yaml
│   │   └── ⚙️ namespace.yaml
│   └── 📁 overlays
│       ├── 📁 gitops
│       │   ├── 📁 patches
│       │   │   └── ⚙️ expose-services.yaml
│       │   └── ⚙️ kustomization.yaml
│       └── 📁 local
│           ├── 📁 patches
│           │   └── ⚙️ expose-services.yaml
│           ├── ⚙️ kind-cluster.yaml
│           └── ⚙️ kustomization.yaml
├── ⚙️ .gitignore
├── 📝 Project_plan.md
├── 📝 README.md
├── ⚙️ docker-compose.yml
└── 📄 sonar-project.properties
```

---

_Generated by FileTree Pro Extension_
