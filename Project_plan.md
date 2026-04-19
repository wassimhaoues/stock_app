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

## Matrice des rôles et permissions

| Module | ADMIN | GESTIONNAIRE stock | OBSERVATEUR |
|--------|-------|--------------------|-------------|
| Utilisateurs | Gérer | Aucun accès | Aucun accès |
| Entrepôts | Gérer | Lecture seule | Lecture seule |
| Produits | Gérer | Gérer | Lecture seule |
| Stocks | Gérer | Gérer | Lecture seule |
| Mouvements stock | Gérer | Gérer | Lecture seule |
| Alertes | Consulter | Voir | Lecture seule |
| Dashboard | Consulter | Consulter | Consulter |

**Règles globales :**
- `ADMIN` peut créer, modifier, supprimer et consulter les modules métier, et il est le seul rôle autorisé à gérer les utilisateurs.
- `GESTIONNAIRE stock` est affecté à un seul entrepôt. Il peut créer, modifier, supprimer et consulter les produits, stocks et mouvements stock uniquement dans son entrepôt affecté. Il peut consulter les alertes et le dashboard filtrés sur son entrepôt. Les autres entrepôts restent en lecture seule ou invisibles selon l'écran.
- `OBSERVATEUR` est aussi affecté à un seul entrepôt. Il peut consulter le dashboard et voir les données de son entrepôt affecté uniquement en lecture seule, sans action de création, modification ou suppression.
- Côté API, les requêtes `GET` des modules métier doivent rester accessibles aux trois rôles authentifiés, tandis que les requêtes d'écriture sont limitées selon la matrice ci-dessus.
- Côté Angular, les menus, boutons d'action et routes doivent suivre la même matrice pour éviter d'afficher des actions interdites.
- Toute règle backend liée au stock doit contrôler l'entrepôt affecté du `GESTIONNAIRE` et de l'`OBSERVATEUR` à partir de l'utilisateur authentifié, pas seulement depuis les paramètres envoyés par le frontend.

---

## Suivi des phases

| Phase | Nom | Statut |
|-------|-----|--------|
| 0 | Planification & décisions | ✅ DONE |
| 1 | Fondations : backend + frontend | ✅ DONE |
| 2 | Authentification & sécurité | ✅ DONE |
| 3 | Administration utilisateurs & permissions | ✅ DONE |
| 4 | Gestion des entrepôts (end-to-end) | ⬜ TODO |
| 5 | Gestion des produits (end-to-end) | ⬜ TODO |
| 6 | Stocks & mouvements (end-to-end) | ⬜ TODO |
| 7 | Alertes & dashboard | ⬜ TODO |
| 8 | Tests, Docker, nettoyage final | ⬜ TODO |

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
- `GET /api/health` sur le port défini par `BACKEND_PORT` → 200 ✅
- Swagger UI sur le port défini par `BACKEND_PORT` → charge ✅
- `ng serve` → Angular sur port 4200 ✅
- La page Angular affiche "Backend connecté" ✅

**Branch git :** `feature/phase-1-foundation`

---

## Phase 2 — Authentification & sécurité [DONE]

**Objectif :** Login fonctionnel avec JWT. Utilisateurs seedés par rôle. Guards Angular sur les routes.

**Backend :**
- Entité `Utilisateur` (id, nom, email, motDePasse, role) ✅
- Enum `Role` : ADMIN, GESTIONNAIRE, OBSERVATEUR ✅
- `AuthController` : `POST /api/auth/login` → JWT ✅
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

## Phase 3 — Administration utilisateurs & permissions [DONE]

**Objectif :** Permettre à l'ADMIN de gérer les comptes utilisateurs avant d'ouvrir les modules métier suivants, puis définir la matrice de permissions utilisée par toutes les phases.

**Backend :**
- `UtilisateurController` : CRUD utilisateurs réservé à `ADMIN` ✅
- `UtilisateurService` : création, modification, suppression, unicité email, hash mot de passe ✅
- Edition utilisateur : le mot de passe est optionnel, il reste inchangé si le champ est vide ✅
- Champ provisoire `entrepotNom` sur `Utilisateur` pour affecter un `GESTIONNAIRE` ou `OBSERVATEUR` à un entrepôt avant la création de l'entité `Entrepot` ✅
- Règle métier : `entrepotNom` est obligatoire pour `GESTIONNAIRE` / `OBSERVATEUR` et ignoré pour `ADMIN` ✅
- Endpoints `/api/utilisateurs/**` protégés par `hasRole("ADMIN")` ✅
- Règle sécurité globale : les `GET /api/**` métier restent accessibles aux rôles authentifiés, les écritures restent limitées par rôle ✅

**Frontend :**
- Route `/utilisateurs` visible et accessible uniquement pour `ADMIN` ✅
- Page administration utilisateurs : liste, création, édition, suppression ✅
- Sélecteur de rôle : `ADMIN`, `GESTIONNAIRE`, `OBSERVATEUR` ✅
- Champ `Entrepot affecte` affiché et requis pour `GESTIONNAIRE` / `OBSERVATEUR` ✅
- En édition, laisser le mot de passe vide conserve le mot de passe actuel ✅
- `RoleGuard` appliqué sur les routes réservées ✅

**Modifications à appliquer aux phases suivantes :**
- Chaque nouveau module doit définir ses accès backend avec `@PreAuthorize` ou `SecurityConfig` selon la matrice des rôles.
- Les composants Angular doivent masquer les boutons create/edit/delete pour `OBSERVATEUR`.
- Les composants Angular doivent masquer les actions non autorisées au `GESTIONNAIRE stock`, notamment les actions d'écriture sur les entrepôts.
- Les services frontend peuvent garder les méthodes d'écriture, mais les pages doivent ne les appeler que si le rôle courant y est autorisé.
- Les tableaux/lists doivent rester consultables par `OBSERVATEUR` en lecture seule, filtrés sur son entrepôt affecté.
- Les pages produits, stocks, mouvements, alertes et dashboard doivent filtrer les données du `GESTIONNAIRE stock` et de l'`OBSERVATEUR` sur leur entrepôt affecté.

**Branch git :** `feature/phase-3-user-management`

---

## Phase 4 — Gestion des entrepôts (end-to-end)

**Objectif :** CRUD complet pour les entrepôts : liste, création, édition, suppression.

**Entité :** `Entrepot` (id, nom, adresse, capacite)

**Accès :**
- `ADMIN` : CRUD complet
- `GESTIONNAIRE stock` : lecture seule
- `OBSERVATEUR` : lecture seule uniquement sur son entrepôt affecté

**Infra :**
- Ajouter la table `entrepots` dans `infra/mysql-init/01-schema.sql`
- Remplacer l'affectation provisoire `Utilisateur.entrepotNom` par une relation propre `Utilisateur.entrepot` / `entrepot_id` pour les comptes `GESTIONNAIRE` et `OBSERVATEUR`, ou prévoir une migration claire si le champ texte est conservé temporairement

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
- Masquer les actions create/edit/delete si le rôle courant n'est pas `ADMIN`
- Adapter le formulaire utilisateurs pour sélectionner un entrepôt existant au lieu de saisir un nom libre pour les `GESTIONNAIRE` et `OBSERVATEUR`

**Branch git :** `feature/phase-4-entrepots`

---

## Phase 5 — Gestion des produits (end-to-end)

**Objectif :** CRUD complet pour les produits.

**Entité :** `Produit` (id, nom, categorie, prix, fournisseur, seuilMin)

**Accès :**
- `ADMIN` : CRUD complet
- `GESTIONNAIRE stock` : CRUD complet uniquement dans son entrepôt affecté
- `OBSERVATEUR` : lecture seule uniquement dans son entrepôt affecté

**Infra :**
- Ajouter la table `produits` dans `infra/mysql-init/01-schema.sql`

**Frontend :**
- Masquer les actions create/edit/delete pour `OBSERVATEUR`
- Filtrer ou préremplir l'entrepôt affecté pour `GESTIONNAIRE stock` et `OBSERVATEUR`

**Branch git :** `feature/phase-5-produits`

---

## Phase 6 — Stocks & mouvements (end-to-end)

**Objectif :** Gestion des stocks par entrepôt + enregistrement des entrées/sorties.

**Entités :**
- `Stock` (id, produit FK, entrepot FK, quantite, seuilAlerte)
- `MouvementStock` (id, produit FK, entrepot FK, type [ENTREE/SORTIE], quantite, date)

**Accès :**
- `ADMIN` : CRUD stocks + création/consultation mouvements
- `GESTIONNAIRE stock` : CRUD stocks + création/consultation mouvements uniquement dans son entrepôt affecté
- `OBSERVATEUR` : lecture seule sur stocks et mouvements uniquement dans son entrepôt affecté

**Infra :**
- Ajouter les tables `stocks` et `mouvement_stock` dans `infra/mysql-init/01-schema.sql`

**Règles métier :**
- Une SORTIE est rejetée si stock insuffisant (409 Conflict)
- Badge d'alerte inline quand `quantite <= seuilAlerte`
- `OBSERVATEUR` ne peut déclencher aucun mouvement de stock
- `GESTIONNAIRE stock` ne peut pas lire, créer, modifier ou supprimer un stock/mouvement lié à un autre entrepôt que celui affecté à son compte
- `OBSERVATEUR` ne peut pas lire un stock/mouvement lié à un autre entrepôt que celui affecté à son compte

**Frontend :**
- Masquer les formulaires et actions de mouvement pour `OBSERVATEUR`
- Pour `GESTIONNAIRE stock` et `OBSERVATEUR`, verrouiller ou filtrer le choix d'entrepôt sur l'entrepôt affecté

**Branch git :** `feature/phase-6-stocks`

---

## Phase 7 — Alertes & dashboard

**Objectif :** Système d'alertes stock faible + dashboard avec métriques clés.

**Accès :**
- `ADMIN` : consultation alertes + dashboard
- `GESTIONNAIRE stock` : consultation alertes + dashboard filtrés sur son entrepôt affecté
- `OBSERVATEUR` : consultation alertes + dashboard en lecture seule filtrés sur son entrepôt affecté

**Endpoints :**
- `GET /api/alertes` : stocks où `quantite <= seuilAlerte`
- `GET /api/dashboard/stats` : totaux (entrepôts, produits, alertes, mouvements du jour)

**Infra :**
- Si la phase ajoute des tables ou vues SQL dédiées au dashboard/alertes, les ajouter aussi dans `infra/mysql-init/01-schema.sql`

**Dashboard :**
- 4 cards statistiques
- Tableau des alertes actives
- Badge alerte dans la sidebar

**Branch git :** `feature/phase-7-dashboard`

---

## Phase 8 — Tests, Docker, nettoyage final

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
- Vérifier que toutes les tables ajoutées dans les phases 2 à 7 sont présentes dans `infra/mysql-init/01-schema.sql`
- Vérifier la matrice des rôles sur les routes backend et frontend avant livraison finale

**Branch git :** `feature/phase-8-docker-cleanup`

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
