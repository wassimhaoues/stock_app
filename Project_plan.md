# StockPro — Project Plan
### Système de gestion des stocks multi-entrepôts

**Projet universitaire JEE — Subject 1**

---

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Backend | Spring Boot 4.0.5, Java 17 |
| Frontend | Angular + Angular Material |
| Base de données | MySQL 8.0 |
| Authentification | JWT (Spring Security) |
| API Docs | Swagger / SpringDoc OpenAPI |
| Infrastructure | Docker + docker-compose |
| Versioning | Git + GitHub |

---

## Décisions techniques verrouillées

| Décision | Choix |
|----------|-------|
| UI Framework | Angular Material |
| Langue UI | Français |
| Style dashboard | Cards statistiques + tableau alertes |
| Authentification | JWT stateless |
| Rôles utilisateurs | ADMIN / GESTIONNAIRE / OBSERVATEUR |
| Nom de l'application | StockPro |

---

## Suivi des phases

| Phase | Nom | Statut |
|-------|-----|--------|
| 0 | Planification & décisions | ✅ DONE |
| 1 | Fondations : backend + frontend | ✅ DONE |
| 2 | Authentification & utilisateurs | ✅ DONE |
| 3 | Gestion des entrepôts (end-to-end) | ⬜ TODO |
| 4 | Gestion des produits (end-to-end) | ⬜ TODO |
| 5 | Stocks & mouvements (end-to-end) | ⬜ TODO |
| 6 | Alertes & dashboard | ⬜ TODO |
| 7 | Tests, Docker, nettoyage final | ⬜ TODO |

---

## Phase 0 — Planification & décisions [DONE]

**Objectif :** Verrouiller le plan, répondre aux questions de décision, établir les règles d'hygiène.

**Livrables :**
- `PROJECT_PLAN.md` ✅
- `README.md` ✅
- `docs/API.md` ✅
- `.env.example` ✅
- `.env` exclu du git ✅

---

## Phase 1 — Fondations : Backend + Frontend [DONE]

**Objectif :** API skeleton fonctionnelle + Angular scaffoldé. Les deux démarrent. Health check visible. Swagger accessible.

**Backend :**
- Dépendance SpringDoc OpenAPI → Swagger UI sur `/swagger-ui.html`
- `GlobalExceptionHandler` avec format d'erreur standard
- Config CORS pour Angular (port 4200)
- `GET /api/health` endpoint propre
- `application.properties` compatible dev + docker, avec MySQL comme unique base active

**Frontend :**
- Angular créé dans `frontend/` avec Angular CLI
- Angular Material installé et configuré
- Routing lazy-loaded mis en place
- Structure `core/` (services, models, interceptors — placeholders)
- Layout principal : sidebar + header
- Page d'accueil qui appelle `GET /api/health`

**Définition of done :**
- `mvn spring-boot:run` démarre sans erreur ✅
- `GET http://localhost:8085/api/health` → 200 ✅
- `http://localhost:8085/swagger-ui.html` → charge ✅
- `ng serve` → Angular sur port 4200 ✅
- La page Angular affiche "Backend connecté" ✅

**Branch git :** `feature/phase-1-foundation`

---

## Phase 2 — Authentification & utilisateurs [DONE]

**Objectif :** Login fonctionnel avec JWT. Utilisateur ADMIN seedé. Guards Angular sur les routes.

**Backend :**
- Entité `Utilisateur` (id, nom, email, motDePasse, role) ✅
- Enum `Role` : ADMIN, GESTIONNAIRE, OBSERVATEUR ✅
- `AuthController` : `POST /api/auth/login` → JWT ✅
- `UtilisateurController` : CRUD (ADMIN uniquement) ✅
- `JwtUtil`, `JwtAuthFilter`, `UserDetailsServiceImpl` ✅
- `SecurityConfig` complet avec règles par rôle ✅
- `DataInitializer` : seède 3 utilisateurs configurables dans la base MySQL active (1 par rôle) ✅
- Si une nouvelle table est créée pour la phase, mettre à jour `infra/mysql-init/01-schema.sql` ✅

**Frontend :**
- `AuthService` (login, logout, stockage token, vérification rôle) ✅
- `JwtInterceptor` (attache le token à chaque requête) ✅
- `AuthGuard` (protège les routes) ✅
- Page de login (formulaire Angular Material) ✅
- Bouton déconnexion dans le header ✅

**Branch git :** `feature/phase-2-auth`

---

## Phase 3 — Gestion des entrepôts (end-to-end)

**Objectif :** CRUD complet pour les entrepôts : liste, création, édition, suppression.

**Entité :** `Entrepot` (id, nom, adresse, capacite)

**Infra :**
- Ajouter la table `entrepots` dans `infra/mysql-init/01-schema.sql`

**Endpoints :**
- `GET /api/entrepots`
- `POST /api/entrepots`
- `GET /api/entrepots/{id}`
- `PUT /api/entrepots/{id}`
- `DELETE /api/entrepots/{id}`

**Frontend :**
- Route `/entrepots`
- Tableau avec actions (éditer, supprimer)
- Formulaire create/edit (dialog ou page)
- Dialogue de confirmation avant suppression
- États : chargement, vide, erreur

**Branch git :** `feature/phase-3-entrepots`

---

## Phase 4 — Gestion des produits (end-to-end)

**Objectif :** CRUD complet pour les produits.

**Entité :** `Produit` (id, nom, categorie, prix, fournisseur, seuilMin)

**Infra :**
- Ajouter la table `produits` dans `infra/mysql-init/01-schema.sql`

**Branch git :** `feature/phase-4-produits`

---

## Phase 5 — Stocks & mouvements (end-to-end)

**Objectif :** Gestion des stocks par entrepôt + enregistrement des entrées/sorties.

**Entités :**
- `Stock` (id, produit FK, entrepot FK, quantite, seuilAlerte)
- `MouvementStock` (id, produit FK, entrepot FK, type [ENTREE/SORTIE], quantite, date)

**Infra :**
- Ajouter les tables `stocks` et `mouvement_stock` dans `infra/mysql-init/01-schema.sql`

**Règles métier :**
- Une SORTIE est rejetée si stock insuffisant (409 Conflict)
- Badge d'alerte inline quand `quantite <= seuilAlerte`

**Branch git :** `feature/phase-5-stocks`

---

## Phase 6 — Alertes & dashboard

**Objectif :** Système d'alertes stock faible + dashboard avec métriques clés.

**Endpoints :**
- `GET /api/alertes` : stocks où `quantite <= seuilAlerte`
- `GET /api/dashboard/stats` : totaux (entrepôts, produits, alertes, mouvements du jour)

**Infra :**
- Si la phase ajoute des tables ou vues SQL dédiées au dashboard/alertes, les ajouter aussi dans `infra/mysql-init/01-schema.sql`

**Dashboard :**
- 4 cards statistiques
- Tableau des alertes actives
- Badge alerte dans la sidebar

**Branch git :** `feature/phase-6-dashboard`

---

## Phase 7 — Tests, Docker, nettoyage final

**Objectif :** Packaging production-ready, Docker full-stack, README complet.

**Backend :**
- Tests unitaires services (JUnit 5 + Mockito)
- Test d'intégration auth
- Profiles `dev` et `prod`
- Dockerfile backend

**Frontend :**
- Dockerfile frontend (nginx)
- Audit états loading/error/empty

**Infra :**
- `docker-compose.yml` racine : MySQL + backend + frontend
- Review `01-schema.sql` (index, FK, contraintes)
- Vérifier que toutes les tables ajoutées dans les phases 2 à 6 sont présentes dans `infra/mysql-init/01-schema.sql`

**Branch git :** `feature/phase-7-docker-cleanup`

---

## Structure des dossiers

### Backend — `com.wassim.stock`
```
config/          SecurityConfig, SwaggerConfig, CorsConfig
controller/      AuthController, EntrepotController, ProduitController,
                 StockController, MouvementStockController, UtilisateurController
dto/
  request/       LoginRequest, EntrepotRequest, ProduitRequest, StockRequest,
                 MouvementStockRequest, UtilisateurRequest
  response/      AuthResponse, EntrepotResponse, ProduitResponse, StockResponse,
                 MouvementStockResponse, AlerteStockResponse, UtilisateurResponse
entity/          Entrepot, Produit, Stock, MouvementStock, Utilisateur
exception/       GlobalExceptionHandler, ResourceNotFoundException,
                 StockInsuffisantException
repository/      (un par entité)
security/        JwtUtil, JwtAuthFilter, UserDetailsServiceImpl
service/         EntrepotService, ProduitService, StockService,
                 MouvementStockService, AlerteService, UtilisateurService
```

### Frontend — `src/app`
```
core/
  guards/        auth.guard.ts
  interceptors/  jwt.interceptor.ts
  models/        entrepot, produit, stock, mouvement-stock, utilisateur
  services/      (un par entité + auth)
shared/
  layout/        sidebar, header, main-layout
  components/    confirm-dialog, alert-badge
features/
  auth/login/
  dashboard/
  entrepots/     entrepot-list, entrepot-form
  produits/      produit-list, produit-form
  stocks/        stock-list, stock-form
  mouvements/    mouvement-list, mouvement-form
  utilisateurs/  utilisateur-list, utilisateur-form
```

---

## Workflow Git

```
main  ← branche stable, merge après chaque phase validée
  └── feature/phase-X-nom
```

**Conventions commits :**
```
feat(entrepot): add CRUD endpoints and service layer
feat(frontend): add entrepot list and form components
fix(stock): correct low-stock alert threshold logic
chore: add Swagger config and OpenAPI dependency
test: add service unit tests for StockService
docs: update README with dev instructions
```
