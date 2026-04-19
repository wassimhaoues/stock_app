# StockPro — Project Plan

### Système de gestion des stocks multi-entrepôts

**Projet universitaire JEE — Subject 1**

---

## Stack technique

| Composant        | Technologie                 |
| ---------------- | --------------------------- |
| Backend          | Spring Boot 4.0.5, Java 17  |
| Frontend         | Angular + Angular Material  |
| Base de données  | MySQL 8.0                   |
| Authentification | JWT (Spring Security)       |
| API Docs         | Swagger / SpringDoc OpenAPI |
| Infrastructure   | Docker + docker-compose     |
| Versioning       | Git + GitHub                |

---

## Décisions techniques verrouillées

| Décision             | Choix                                |
| -------------------- | ------------------------------------ |
| UI Framework         | Angular Material                     |
| Langue UI            | Français                             |
| Style dashboard      | Section analytique KPI + cards + graphiques + tableau alertes |
| Authentification     | JWT stateless                        |
| Rôles utilisateurs   | ADMIN / GESTIONNAIRE / OBSERVATEUR   |
| Nom de l'application | StockPro                             |

---

## Matrice des rôles et permissions

| Module           | ADMIN     | GESTIONNAIRE stock                          | OBSERVATEUR                                  |
| ---------------- | --------- | ------------------------------------------- | -------------------------------------------- |
| Utilisateurs     | Gérer     | Aucun accès                                 | Aucun accès                                  |
| Entrepôts        | Gérer     | Lecture seule                               | Lecture seule sur son entrepôt affecté       |
| Produits         | Gérer     | Lecture seule                               | Lecture seule                                |
| Stocks           | Gérer     | Gérer dans son entrepôt affecté             | Lecture seule dans son entrepôt affecté      |
| Mouvements stock | Gérer     | Gérer dans son entrepôt affecté             | Lecture seule dans son entrepôt affecté      |
| Alertes          | Consulter | Voir les alertes de son entrepôt affecté    | Voir les alertes de son entrepôt affecté     |
| Dashboard        | Consulter | Consulter les données de son entrepôt       | Consulter les données de son entrepôt        |

**Règles globales :**

- `ADMIN` peut créer, modifier, supprimer et consulter les modules métier, et il est le seul rôle autorisé à gérer les utilisateurs.
- `GESTIONNAIRE stock` est affecté à un seul entrepôt. Il peut consulter les produits globaux, et créer, modifier, supprimer et consulter les stocks et mouvements stock uniquement dans son entrepôt affecté. Il peut consulter les alertes et le dashboard filtrés sur son entrepôt.
- `OBSERVATEUR` est aussi affecté à un seul entrepôt. Il peut consulter les produits globaux, le dashboard et les données de son entrepôt affecté uniquement en lecture seule, sans action de création, modification ou suppression.
- Côté API, les requêtes `GET` des modules métier doivent rester accessibles aux trois rôles authentifiés. Les produits sont globaux; les données liées à un entrepôt sont filtrées par entrepôt pour `GESTIONNAIRE stock` et `OBSERVATEUR`.
- Côté API, les requêtes d'écriture sont limitées selon la matrice ci-dessus.
- Côté Angular, les menus, boutons d'action et routes doivent suivre la même matrice pour éviter d'afficher des actions interdites.
- Toute règle backend liée aux données d'entrepôt doit contrôler l'entrepôt affecté du `GESTIONNAIRE` et de l'`OBSERVATEUR` à partir de l'utilisateur authentifié, pas seulement depuis les paramètres envoyés par le frontend.

---

## Suivi des phases

| Phase | Nom                                | Statut  |
| ----- | ---------------------------------- | ------- |
| 0     | Planification & décisions          | ✅ DONE |
| 1     | Fondations : backend + frontend    | ✅ DONE |
| 2     | Authentification & sécurité        | ✅ DONE |
| 3     | Administration utilisateurs & permissions | ✅ DONE |
| 4     | Gestion des entrepôts (end-to-end) | ✅ DONE |
| 5     | Gestion des produits (end-to-end)  | ✅ DONE |
| 6     | Stocks & mouvements (end-to-end)   | ⬜ TODO |
| 7     | Alertes & dashboard analytique     | ⬜ TODO |
| 8     | Revue UX/UI frontend professionnelle | ⬜ TODO |
| 9     | Validation métier, sécurité & données réalistes | ⬜ TODO |
| 10    | Tests, Docker, nettoyage final     | ⬜ TODO |

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
- Les tableaux/lists doivent rester consultables par `OBSERVATEUR` en lecture seule, avec filtrage par entrepôt uniquement pour les données liées à un entrepôt.
- Les pages stocks, mouvements, alertes et dashboard doivent filtrer les données du `GESTIONNAIRE stock` et de l'`OBSERVATEUR` sur leur entrepôt affecté; les produits restent un catalogue global en lecture seule pour ces rôles.

**Branch git :** `feature/phase-3-user-management`

---

## Phase 4 — Gestion des entrepôts (end-to-end) [DONE]

**Objectif :** CRUD complet pour les entrepôts : liste, création, édition, suppression.

**Entité :** `Entrepot` (id, nom, adresse, capacite)

**Accès :**

- `ADMIN` : CRUD complet
- `GESTIONNAIRE stock` : lecture seule uniquement sur son entrepôt affecté
- `OBSERVATEUR` : lecture seule uniquement sur son entrepôt affecté

**Infra :**

- Ajouter la table `entrepots` dans `infra/mysql-init/01-schema.sql` ✅
- Remplacer l'affectation provisoire `Utilisateur.entrepotNom` par une relation propre `Utilisateur.entrepot` / `entrepot_id` pour les comptes `GESTIONNAIRE` et `OBSERVATEUR` ✅

**Endpoints :**

- `GET /api/entrepots` ✅
- `POST /api/entrepots` ✅
- `GET /api/entrepots/{id}` ✅
- `PUT /api/entrepots/{id}` ✅
- `DELETE /api/entrepots/{id}` ✅

**Frontend :**

- Route `/entrepots` ✅
- Tableau avec actions (éditer, supprimer) ✅
- Formulaire create/edit (dialog ou page) ✅
- Dialogue de confirmation avant suppression ✅
- États : chargement, vide, erreur ✅
- Masquer les actions create/edit/delete si le rôle courant n'est pas `ADMIN` ✅
- Adapter le formulaire utilisateurs pour sélectionner un entrepôt existant au lieu de saisir un nom libre pour les `GESTIONNAIRE` et `OBSERVATEUR` ✅

**Branch git :** `feature/phase-4-entrepots`

---

## Phase 5 — Gestion des produits (end-to-end) [DONE]

**Objectif :** CRUD complet pour les produits.

**Entité :** `Produit` (id, nom, categorie, prix, fournisseur, seuilMin) ✅

**Accès :**

- `ADMIN` : CRUD complet ✅
- `GESTIONNAIRE stock` : lecture seule sur le catalogue global ✅
- `OBSERVATEUR` : lecture seule sur le catalogue global ✅

**Infra :**

- Ajouter la table `produits` dans `infra/mysql-init/01-schema.sql` ✅

**Endpoints :**

- `GET /api/produits` ✅
- `POST /api/produits` réservé à `ADMIN` ✅
- `GET /api/produits/{id}` ✅
- `PUT /api/produits/{id}` réservé à `ADMIN` ✅
- `DELETE /api/produits/{id}` réservé à `ADMIN` ✅

**Frontend :**

- Route `/produits` ✅
- Tableau avec actions (éditer, supprimer) ✅
- Formulaire create/edit ✅
- Dialogue de confirmation avant suppression ✅
- États : chargement, vide, erreur ✅
- Masquer les actions create/edit/delete pour `GESTIONNAIRE stock` et `OBSERVATEUR` ✅
- Afficher le catalogue global des produits aux trois rôles authentifiés ✅

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

## Phase 7 — Alertes & dashboard analytique

**Objectif :** Système d'alertes stock faible + dashboard analytique avec des KPI réels, utiles pour piloter l'activité et améliorer les décisions métier.

**Accès :**

- `ADMIN` : consultation alertes + dashboard global avec vision multi-entrepôts et analytics avancés
- `GESTIONNAIRE stock` : consultation alertes + dashboard filtrés sur son entrepôt affecté
- `OBSERVATEUR` : consultation alertes + dashboard en lecture seule filtrés sur son entrepôt affecté

**Endpoints :**

- `GET /api/alertes` : stocks où `quantite <= seuilAlerte`
- `GET /api/dashboard/stats` : totaux opérationnels selon le rôle connecté
- `GET /api/dashboard/kpis` : KPI métier calculés depuis les vrais produits, stocks, mouvements et entrepôts
- `GET /api/dashboard/analytics` : séries et répartitions pour graphiques, tendances et comparaisons
- `GET /api/dashboard/admin/analytics` : analytics globaux réservés à `ADMIN`

**Infra :**

- Si la phase ajoute des tables ou vues SQL dédiées au dashboard/alertes, les ajouter aussi dans `infra/mysql-init/01-schema.sql`

**Dashboard :**

- Section analytique principale en haut du dashboard `ADMIN`, large et prioritaire visuellement
- KPI `ADMIN` calculés depuis les données réelles :
  - valeur totale du stock
  - valeur du stock par entrepôt
  - nombre de produits actifs
  - produits sous seuil critique
  - taux de risque de rupture
  - mouvements entrants/sortants du jour, de la semaine et du mois
  - tendance des mouvements par période
  - produits les plus mouvementés
  - produits avec stock dormant ou faible rotation
  - entrepôts les plus actifs
  - couverture estimée du stock quand les mouvements permettent de la calculer
- Cards synthétiques pour les indicateurs rapides
- Graphiques clairs : mouvements dans le temps, répartition par entrepôt, top produits, alertes par gravité
- Tableau des alertes actives avec priorité, produit, entrepôt, quantité, seuil et action attendue
- Badge alerte dans la sidebar
- Dashboard `GESTIONNAIRE stock` limité à son entrepôt affecté : KPI, graphiques, stocks, mouvements et alertes uniquement pour cet entrepôt
- Dashboard `OBSERVATEUR` limité à son entrepôt affecté et strictement en lecture seule
- Aucun KPI fictif : chaque chiffre affiché doit être calculé depuis la base de données ou masqué si les données nécessaires n'existent pas encore

**Branch git :** `feature/phase-7-analytics-dashboard`

---

## Phase 8 — Revue UX/UI frontend professionnelle

**Objectif :** Reprendre tout le frontend pour obtenir une interface moderne, organisée, cohérente et crédible, sans traces de préparation, de démo technique ou d'apparence "vibe-coded".

**Périmètre :**

- Revoir toutes les pages : login, layout, sidebar, header, dashboard, utilisateurs, entrepôts, produits, stocks, mouvements et alertes
- Supprimer tout texte visible de type préparation, phase, placeholder, explication technique, "Backend connecté", "TODO", "demo", ou description qui ne fait pas partie de l'expérience utilisateur finale
- Garder une interface 100 % en français, avec des libellés métier courts, professionnels et homogènes
- Harmoniser la hiérarchie visuelle : titres, sous-titres utiles, spacing, densité, alignements, tailles de tableaux, actions principales et actions secondaires
- Donner à StockPro une identité visuelle propre : moderne, sobre, mémorable, adaptée à une application professionnelle de gestion de stocks
- Vérifier que l'application ne ressemble pas à un assemblage généré : cohérence des composants, pages finies, pas de sections inutiles, pas de textes décoratifs sans valeur métier

**Frontend :**

- Revoir le layout global pour une navigation claire par rôle
- Rendre la sidebar et le header cohérents avec les permissions réelles
- Moderniser les tableaux : colonnes utiles, actions lisibles, états vide/chargement/erreur propres, filtres si nécessaires
- Moderniser les formulaires : validation claire, messages d'erreur métier, champs requis visibles, boutons d'action bien placés
- Revoir toutes les cartes KPI et graphiques pour une lecture rapide et professionnelle
- Ajouter ou ajuster les états responsives pour desktop et mobile
- S'assurer qu'aucun bouton interdit n'apparaît pour `GESTIONNAIRE stock` ou `OBSERVATEUR`
- S'assurer que `OBSERVATEUR` voit uniquement des interfaces read-only
- Vérifier les contrastes, focus clavier, aria-labels utiles et cohérence Angular Material

**Définition of done :**

- Aucune page ne contient de texte de préparation, de phase, de mock technique ou de description hors produit final
- Les pages principales ont un rendu professionnel en desktop et mobile
- Les permissions visuelles correspondent à la matrice des rôles
- Les données vides, erreurs API et chargements sont traités proprement
- Le dashboard `ADMIN` met réellement en avant les KPI analytiques de la Phase 7
- Le projet donne l'impression d'un produit fini, organisé et unique

**Branch git :** `feature/phase-8-frontend-polish`

---

## Phase 9 — Validation métier, sécurité & données réalistes

**Objectif :** Vérifier le projet de bout en bout avec des scénarios réalistes, renforcer les règles de sécurité métier et préparer une démonstration crédible.

**Backend :**

- Ajouter ou compléter un jeu de données réaliste : plusieurs entrepôts, produits, stocks, mouvements, alertes et utilisateurs affectés
- Vérifier tous les scénarios de rôles :
  - `ADMIN` voit et administre tout
  - `GESTIONNAIRE stock` travaille uniquement dans son entrepôt affecté
  - `OBSERVATEUR` consulte uniquement son entrepôt en lecture seule
- Tester les accès directs API pour empêcher le contournement par modification d'id d'entrepôt
- Vérifier les règles métier critiques : stock insuffisant, seuils d'alerte, unicité email, affectation obligatoire d'entrepôt
- Revoir les erreurs API pour qu'elles soient compréhensibles et cohérentes

**Frontend :**

- Parcours de démonstration complet par rôle
- Vérifier les redirections, menus et pages interdites selon le rôle
- Vérifier que les filtres d'entrepôt affichés correspondent réellement aux données autorisées
- Préparer une expérience de démo fluide avec des données assez riches pour montrer les KPI

**Documentation :**

- Mettre à jour `README.md` avec lancement local, comptes de test, ports et commandes utiles
- Mettre à jour `docs/API.md` ou Swagger avec les endpoints finaux
- Ajouter une section courte expliquant la matrice des rôles et le filtrage par entrepôt

**Branch git :** `feature/phase-9-business-validation-security`

---

## Phase 10 — Tests, Docker, nettoyage final

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
- Vérifier que toutes les tables ajoutées dans les phases 2 à 9 sont présentes dans `infra/mysql-init/01-schema.sql`
- Vérifier la matrice des rôles sur les routes backend et frontend avant livraison finale

**Branch git :** `feature/phase-10-docker-cleanup`

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
                 MouvementStockService, AlerteService, DashboardService,
                 UtilisateurService
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
