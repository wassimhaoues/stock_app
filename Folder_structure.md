## Structure des dossiers

### Backend — `backend/src/main/java/com/wassim/stock`

```
config/
  CorsConfig
  DataInitializer
  SecurityConfig
controller/
  AlerteController
  AuthController
  DashboardController
  EntrepotController
  HealthController
  MouvementStockController
  ProduitController
  StockController
  TestController
  UtilisateurController
dto/
  request/
    EntrepotRequest
    LoginRequest
    MouvementStockRequest
    ProduitRequest
    StockRequest
    UtilisateurRequest
  response/
    AlerteResponse
    AdminAnalyticsResponse
    AuthResponse
    DashboardAnalyticsResponse
    DashboardKpisResponse
    DashboardStatsResponse
    EntrepotResponse
    MouvementStockResponse
    ProduitResponse
    StockResponse
    UtilisateurResponse
entity/
  Entrepot
  MouvementStock
  Produit
  Role
  Stock
  TypeMouvement
  Utilisateur
exception/
  BadRequestException
  ConflictException
  GlobalExceptionHandler
  ResourceNotFoundException
repository/
  EntrepotRepository
  MouvementStockRepository
  ProduitRepository
  StockRepository
  UtilisateurRepository
security/
  JwtAuthFilter
  JwtUtil
  UserDetailsServiceImpl
service/
  AlerteService
  AuthService
  DashboardService
  EntrepotService
  MouvementStockService
  ProduitService
  StockService
  UtilisateurService
```

### Backend resources — `backend/src/main/resources`

```
application.properties
application-dev.properties
application-docker.properties
```

### Frontend — `frontend/src/app`

```
app.config.ts
app.html
app.routes.ts
app.scss
app.spec.ts
app.ts
core/
  guards/
    auth.guard.ts
    guest.guard.ts
    role.guard.ts
  interceptors/
    jwt.interceptor.ts
  models/
    alerte.model.ts
    auth-response.model.ts
    dashboard.model.ts
    entrepot-request.model.ts
    entrepot.model.ts
    health-status.model.ts
    login-request.model.ts
    mouvement-stock-request.model.ts
    mouvement-stock.model.ts
    produit-request.model.ts
    produit.model.ts
    role.model.ts
    stock-request.model.ts
    stock.model.ts
    type-mouvement.model.ts
    utilisateur-request.model.ts
    utilisateur.model.ts
  services/
    alerte.service.ts
    auth.service.ts
    dashboard.service.ts
    entrepot.service.ts
    health.service.ts
    mouvement-stock.service.ts
    produit.service.ts
    stock.service.ts
    utilisateur.service.ts
features/
  auth/
    login-page.component.ts
  alertes/
    alertes-page.component.ts
  entrepots/
    entrepots-page.component.ts
  home/
    home-page.component.ts
  produits/
    produits-page.component.ts
  stocks/
    stocks-page.component.ts
  utilisateurs/
    utilisateurs-page.component.ts
shared/
  components/
    confirm-dialog/
      confirm-dialog.component.ts
  layout/
    header/
      header.component.ts
    main-layout/
      main-layout.component.ts
    sidebar/
      sidebar.component.ts
```

### Infra — `infra`

```
.env
.env.example
docker-compose.yml
mysql-init/
  01-schema.sql
```

### Docs — `docs/agile`

```
Projet_DevOps.md
product-backlog.md
roadmap-grandes-taches.md
```

---
