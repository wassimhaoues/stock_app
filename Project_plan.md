# StockPro — Project Plan

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

| Décision             | Choix                                                         |
| -------------------- | ------------------------------------------------------------- |
| UI Framework         | Angular Material                                              |
| Langue UI            | Français                                                      |
| Style dashboard      | Section analytique KPI + cards + graphiques + tableau alertes |
| Authentification     | JWT stateless                                                 |
| Rôles utilisateurs   | ADMIN / GESTIONNAIRE / OBSERVATEUR                            |
| Nom de l'application | StockPro                                                      |

---

## Matrice des rôles et permissions

| Module           | ADMIN     | GESTIONNAIRE stock                       | OBSERVATEUR                              |
| ---------------- | --------- | ---------------------------------------- | ---------------------------------------- |
| Utilisateurs     | Gérer     | Aucun accès                              | Aucun accès                              |
| Entrepôts        | Gérer     | Lecture seule                            | Lecture seule sur son entrepôt affecté   |
| Produits         | Gérer     | Lecture seule                            | Lecture seule                            |
| Stocks           | Gérer     | Gérer dans son entrepôt affecté          | Lecture seule dans son entrepôt affecté  |
| Mouvements stock | Gérer     | Gérer dans son entrepôt affecté          | Lecture seule dans son entrepôt affecté  |
| Alertes          | Consulter | Voir les alertes de son entrepôt affecté | Voir les alertes de son entrepôt affecté |
| Dashboard        | Consulter | Consulter les données de son entrepôt    | Consulter les données de son entrepôt    |

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

| Phase | Nom                                              | Statut |
| ----- | ------------------------------------------------ | ------ |
| 0     | Planification & décisions                        | DONE   |
| 1     | Fondations : backend + frontend                  | DONE   |
| 2     | Authentification & sécurité                      | DONE   |
| 3     | Administration utilisateurs & permissions        | DONE   |
| 4     | Gestion des entrepôts (end-to-end)               | DONE   |
| 5     | Gestion des produits (end-to-end)                | DONE   |
| 6     | Stocks & mouvements (end-to-end)                 | DONE   |
| 7     | Gestion de la capacité des entrepôts             | DONE   |
| 8     | Alertes & dashboard analytique                   | DONE   |
| 9     | Revue UX/UI frontend professionnelle             | DONE   |
| 10    | Validation métier, sécurité & données réalistes  | TODO   |
| 11    | Tests et nettoyage final                         | DONE   |
| 10    | Validation métier, sécurité & données réalistes  | DONE   |
| 11    | Tests et nettoyage final                         | TODO   |
| 12    | Socle d’exécution locale et préparation du poste | DONE   |
| 13    | Conteneurisation complète                        | DONE   |
| 14    | CI de base sur GitHub Actions                    | TODO   |
| 15    | Qualité logicielle et sécurité de pipeline       | TODO   |
| 16    | Déploiement Kubernetes local                     | TODO   |
| 17    | GitOps et ArgoCD                                 | TODO   |
| 18    | Observabilité et alerting                        | TODO   |
| 19    | Amélioration continue et finalisation soutenance | TODO   |

---

## Phase 0 — Planification & décisions [DONE]

**Objectif :** Verrouiller le plan, répondre aux questions de décision, établir les règles d'hygiène.

**Livrables :**

- `PROJECT_PLAN.md`
- `README.md`
- `docs/API.md`
- `.env.example`
- `.env` exclu du git

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

- `mvn spring-boot:run` démarre sans erreur
- `GET http://localhost:8085/api/health` → 200
- `http://localhost:8085/swagger-ui.html` → charge
- `ng serve` → Angular sur port 4200
- La page Angular affiche "Backend connecté"

**Branch git :** `feature/phase-1-foundation`

---

## Phase 2 — Authentification & sécurité [DONE]

**Objectif :** Login fonctionnel avec JWT. Utilisateurs seedés par rôle. Guards Angular sur les routes.

**Backend :**

- Entité `Utilisateur` (id, nom, email, motDePasse, role)
- Enum `Role` : ADMIN, GESTIONNAIRE, OBSERVATEUR
- `AuthController` : `POST /api/auth/login` → JWT
- `JwtUtil`, `JwtAuthFilter`, `UserDetailsServiceImpl`
- `SecurityConfig` complet avec règles par rôle
- `DataInitializer` : seède 3 utilisateurs configurables dans la base MySQL active (1 par rôle)
- Si une nouvelle table est créée pour la phase, mettre à jour `infra/mysql-init/01-schema.sql`

**Frontend :**

- `AuthService` (login, logout, stockage token, vérification rôle)
- `JwtInterceptor` (attache le token à chaque requête)
- `AuthGuard` (protège les routes)
- Page de login (formulaire Angular Material)
- Bouton déconnexion dans le header

**Branch git :** `feature/phase-2-auth`

---

## Phase 3 — Administration utilisateurs & permissions [DONE]

**Objectif :** Permettre à l'ADMIN de gérer les comptes utilisateurs avant d'ouvrir les modules métier suivants, puis définir la matrice de permissions utilisée par toutes les phases.

**Backend :**

- `UtilisateurController` : CRUD utilisateurs réservé à `ADMIN`
- `UtilisateurService` : création, modification, suppression, unicité email, hash mot de passe
- Edition utilisateur : le mot de passe est optionnel, il reste inchangé si le champ est vide
- Champ provisoire `entrepotNom` sur `Utilisateur` pour affecter un `GESTIONNAIRE` ou `OBSERVATEUR` à un entrepôt avant la création de l'entité `Entrepot`
- Règle métier : `entrepotNom` est obligatoire pour `GESTIONNAIRE` / `OBSERVATEUR` et ignoré pour `ADMIN`
- Endpoints `/api/utilisateurs/**` protégés par `hasRole("ADMIN")`
- Règle sécurité globale : les `GET /api/**` métier restent accessibles aux rôles authentifiés, les écritures restent limitées par rôle

**Frontend :**

- Route `/utilisateurs` visible et accessible uniquement pour `ADMIN`
- Page administration utilisateurs : liste, création, édition, suppression
- Sélecteur de rôle : `ADMIN`, `GESTIONNAIRE`, `OBSERVATEUR`
- Champ `Entrepot affecte` affiché et requis pour `GESTIONNAIRE` / `OBSERVATEUR`
- En édition, laisser le mot de passe vide conserve le mot de passe actuel
- `RoleGuard` appliqué sur les routes réservées

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

- Ajouter la table `entrepots` dans `infra/mysql-init/01-schema.sql`
- Remplacer l'affectation provisoire `Utilisateur.entrepotNom` par une relation propre `Utilisateur.entrepot` / `entrepot_id` pour les comptes `GESTIONNAIRE` et `OBSERVATEUR`

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

## Phase 5 — Gestion des produits (end-to-end) [DONE]

**Objectif :** CRUD complet pour les produits.

**Entité :** `Produit` (id, nom, categorie, prix, fournisseur, seuilMin)

**Accès :**

- `ADMIN` : CRUD complet
- `GESTIONNAIRE stock` : lecture seule sur le catalogue global
- `OBSERVATEUR` : lecture seule sur le catalogue global

**Infra :**

- Ajouter la table `produits` dans `infra/mysql-init/01-schema.sql`

**Endpoints :**

- `GET /api/produits`
- `POST /api/produits` réservé à `ADMIN`
- `GET /api/produits/{id}`
- `PUT /api/produits/{id}` réservé à `ADMIN`
- `DELETE /api/produits/{id}` réservé à `ADMIN`

**Frontend :**

- Route `/produits`
- Tableau avec actions (éditer, supprimer)
- Formulaire create/edit
- Dialogue de confirmation avant suppression
- États : chargement, vide, erreur
- Masquer les actions create/edit/delete pour `GESTIONNAIRE stock` et `OBSERVATEUR`
- Afficher le catalogue global des produits aux trois rôles authentifiés

**Branch git :** `feature/phase-5-produits`

---

## Phase 6 — Stocks & mouvements (end-to-end) [DONE]

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

**Endpoints :**

- `GET /api/stocks`
- `POST /api/stocks` réservé à `ADMIN` et `GESTIONNAIRE`
- `GET /api/stocks/{id}`
- `PUT /api/stocks/{id}` réservé à `ADMIN` et `GESTIONNAIRE`
- `DELETE /api/stocks/{id}` réservé à `ADMIN` et `GESTIONNAIRE`
- `GET /api/mouvements-stock`
- `GET /api/mouvements-stock/{id}`
- `POST /api/mouvements-stock` réservé à `ADMIN` et `GESTIONNAIRE`

**Règles métier :**

- Une SORTIE est rejetée si stock insuffisant (409 Conflict)
- Les mouvements ENTREE/SORTIE mettent à jour la quantité du stock existant produit + entrepôt
- Un stock est unique par couple produit + entrepôt
- Badge d'alerte inline quand `quantite <= seuilAlerte`
- `OBSERVATEUR` ne peut déclencher aucun mouvement de stock
- `GESTIONNAIRE stock` ne peut pas lire, créer, modifier ou supprimer un stock/mouvement lié à un autre entrepôt que celui affecté à son compte
- `OBSERVATEUR` ne peut pas lire un stock/mouvement lié à un autre entrepôt que celui affecté à son compte

**Frontend :**

- Route `/stocks`
- Page stocks + mouvements avec formulaires, listes, états chargement/vide/erreur
- Masquer les formulaires et actions de mouvement pour `OBSERVATEUR`
- Masquer les actions create/edit/delete stock pour `OBSERVATEUR`
- Pour `GESTIONNAIRE stock` et `OBSERVATEUR`, filtrer le choix d'entrepôt sur l'entrepôt affecté

**Branch git :** `feature/phase-6-stocks`

---

## Phase 7 — Gestion de la capacité des entrepôts [DONE]

**Objectif :** Transformer `Entrepot.capacite` en contrainte métier réelle. La capacité disponible d'un entrepôt doit être calculée depuis les quantités de stock réellement présentes dans cet entrepôt, affichée aux endroits utiles, et bloquer toute entrée de stock qui dépasserait la capacité maximale.

**Hypothèse de calcul :**

- 1 unité de `Stock.quantite` consomme 1 unité de `Entrepot.capacite`.
- Capacité utilisée = somme des `Stock.quantite` de tous les stocks liés à l'entrepôt.
- Capacité disponible = `Entrepot.capacite - capacité utilisée`.
- Taux d'occupation = `capacité utilisée / Entrepot.capacite`.

**Backend :**

- Ajouter les champs calculés dans la réponse entrepôt, par exemple `capaciteUtilisee`, `capaciteDisponible` et `tauxOccupation`.
- Ajouter les méthodes repository nécessaires pour calculer la somme des quantités de stock par entrepôt.
- Adapter `EntrepotService` pour enrichir les réponses liste/détail avec les indicateurs de capacité.
- Empêcher la modification d'un entrepôt si la nouvelle `capacite` devient inférieure à la capacité déjà utilisée.
- Adapter `StockService` pour refuser la création ou modification d'un stock si la quantité finale dépasse la capacité disponible de l'entrepôt.
- Adapter `MouvementStockService` pour refuser un mouvement `ENTREE` si la quantité ajoutée dépasse la capacité disponible de l'entrepôt.
- Conserver le comportement existant des mouvements `SORTIE` : une sortie diminue le stock et libère de la capacité.
- Retourner une erreur métier claire, idéalement `409 Conflict`, quand une opération dépasse la capacité disponible.
- Respecter les règles d'accès existantes : `ADMIN` global, `GESTIONNAIRE stock` uniquement sur son entrepôt affecté, `OBSERVATEUR` lecture seule uniquement sur son entrepôt affecté.
- Mettre à jour `infra/mysql-init/01-schema.sql` seulement si une contrainte ou un index supplémentaire est nécessaire. Aucun nouveau champ persistant n'est requis pour les valeurs calculées.

**Frontend :**

- Mettre à jour le modèle `Entrepot` pour inclure `capaciteUtilisee`, `capaciteDisponible` et `tauxOccupation`.
- Sur la page `/entrepots`, afficher dans la liste :
  - capacité totale
  - capacité utilisée
  - capacité disponible
  - taux d'occupation avec un indicateur visuel simple et lisible
- Dans le formulaire de création/modification d'entrepôt, afficher près du champ `Capacité` :
  - en création : indication que la capacité définira la limite maximale de stock
  - en modification : capacité utilisée actuelle, capacité disponible actuelle et capacité disponible après modification si la valeur change
- Dans la page `/stocks`, afficher la capacité disponible de l'entrepôt sélectionné dans les formulaires de stock et de mouvement.
- Dans le formulaire de stock, bloquer côté UI la soumission si la quantité finale dépasse la capacité disponible, tout en laissant le backend comme source de vérité.
- Dans le formulaire de mouvement, pour un mouvement `ENTREE`, afficher la capacité restante avant/après mouvement et bloquer la soumission si l'entrée dépasse la capacité disponible.
- Dans les tableaux stocks/mouvements, afficher l'information de capacité seulement là où elle aide la décision, sans surcharger l'interface.
- Pour `GESTIONNAIRE stock` et `OBSERVATEUR`, n'afficher que les indicateurs de capacité de leur entrepôt affecté.
- Pour `OBSERVATEUR`, conserver une interface strictement en lecture seule.

**Règles métier :**

- Un entrepôt ne peut jamais contenir une quantité totale de stock supérieure à sa capacité.
- Toute création de stock consomme de la capacité dans l'entrepôt ciblé.
- Toute augmentation de stock consomme uniquement la différence ajoutée.
- Toute diminution de stock libère de la capacité.
- Un mouvement `ENTREE` consomme de la capacité.
- Un mouvement `SORTIE` libère de la capacité après validation du stock suffisant.
- La suppression d'un stock libère la capacité correspondant à sa quantité.
- La capacité disponible doit être recalculée depuis les stocks réels et ne doit pas être stockée comme valeur persistante.

**Validation :**

- `Entrepot.capacite` doit rester strictement positive.
- Une modification de capacité est rejetée si `nouvelle capacite < capaciteUtilisee`.
- Une création de stock est rejetée si `quantite > capaciteDisponible`.
- Une modification de stock est rejetée si la quantité finale de l'entrepôt dépasse sa capacité.
- Un mouvement `ENTREE` est rejeté si `quantite > capaciteDisponible`.
- Les messages d'erreur doivent expliquer la capacité disponible et la quantité demandée.
- Les validations frontend doivent guider l'utilisateur, mais toutes les règles critiques doivent être appliquées côté backend.

**Comportement UI attendu :**

- L'utilisateur voit toujours la capacité restante avant d'ajouter du stock ou d'enregistrer une entrée.
- Les champs et boutons deviennent clairement invalides/désactivés quand la capacité serait dépassée.
- La liste des entrepôts permet d'identifier rapidement les entrepôts pleins ou presque pleins.
- Les erreurs API de capacité sont affichées comme des messages métier compréhensibles.
- Le dashboard de la phase suivante pourra réutiliser ces indicateurs pour afficher des KPI de saturation des entrepôts.

**Définition of done :**

- Les indicateurs de capacité sont calculés depuis les stocks réels et visibles dans les réponses entrepôt.
- Les listes et formulaires frontend affichent la capacité utilisée/disponible aux endroits nécessaires.
- Le système empêche réellement toute création, modification ou entrée de stock qui dépasse la capacité d'un entrepôt.
- Le `GESTIONNAIRE stock` ne voit et n'utilise que la capacité de son entrepôt affecté.
- L'`OBSERVATEUR` voit uniquement les informations de capacité de son entrepôt affecté, sans action d'écriture.
- Les cas limites sont testés : entrepôt vide, entrepôt presque plein, entrepôt plein, réduction de capacité, entrée trop grande, sortie qui libère de la capacité.
- `mvn test`, `npm run build` et `git diff --check` passent.

**Branch git :** `feature/phase-7-capacite-entrepots`

---

## Phase 8 — Alertes & dashboard analytique [DONE]

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
  - capacité utilisée, capacité disponible et taux de saturation par entrepôt
  - couverture estimée du stock quand les mouvements permettent de la calculer
- Cards synthétiques pour les indicateurs rapides
- Graphiques clairs : mouvements dans le temps, répartition par entrepôt, top produits, alertes par gravité
- Tableau des alertes actives avec priorité, produit, entrepôt, quantité, seuil et action attendue
- Badge alerte dans la sidebar
- Dashboard `GESTIONNAIRE stock` limité à son entrepôt affecté : KPI, graphiques, stocks, mouvements et alertes uniquement pour cet entrepôt
- Dashboard `OBSERVATEUR` limité à son entrepôt affecté et strictement en lecture seule
- Aucun KPI fictif : chaque chiffre affiché doit être calculé depuis la base de données ou masqué si les données nécessaires n'existent pas encore

**Branch git :** `feature/phase-8-analytics-dashboard`

---

## Phase 9 — Revue UX/UI frontend professionnelle [DONE]

**Objectif :** Reprendre tout le frontend pour obtenir une interface moderne, organisée, cohérente et crédible.

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
- Harmoniser les libellés, icônes et actions primaires/secondaires sur toutes les pages
- Supprimer les composants redondants, sections décoratives et messages techniques visibles

**Définition of done :**

- Aucune page ne contient de texte de préparation, de phase, de mock technique ou de description hors produit final
- Les pages principales ont un rendu professionnel en desktop et mobile
- Les permissions visuelles correspondent à la matrice des rôles
- Les données vides, erreurs API et chargements sont traités proprement
- Le dashboard `ADMIN` met réellement en avant les KPI analytiques de la Phase 8
- Le projet donne l'impression d'un produit fini, organisé et unique
- L’interface garde une cohérence visuelle complète entre les modules principaux

**Branch git :** `feature/phase-9-frontend-polish`

---

## Phase 10 — Validation métier, sécurité & données réalistes [DONE]

**Objectif :** Vérifier le projet de bout en bout avec des scénarios réalistes, renforcer les règles de sécurité métier et préparer une démonstration crédible.

**Backend :**

- Introduire un mode de données piloté par variable d'environnement, par exemple `STOCKPRO_DEMO_DATA=true|false`
- En mode normal, garder la base propre et n'initialiser qu'un compte `ADMIN` minimal pour l'administration initiale
- En mode démo, charger un jeu de données complet et réaliste avec :
  - des noms tunisiens pour les personnes, les entrepôts et les lieux de démo
  - des entrepôts et affectations cohérents avec le contexte tunisien
  - plusieurs entrepôts, produits, stocks, mouvements, alertes et utilisateurs affectés
  - des familles de produits limitées à l'informatique, gaming, téléphonie, TV, photo, son et électroménager
  - des noms de produits réels et parlants, par exemple `Gamer MSI Thin 15 B13UCX i5 13è Gén 24G RTX 2050`
  - aucun produit alimentaire, vêtement ou catégorie hors sujet
- Vérifier tous les scénarios de rôles :
  - `ADMIN` voit et administre tout
  - `GESTIONNAIRE stock` travaille uniquement dans son entrepôt affecté
  - `OBSERVATEUR` consulte uniquement son entrepôt en lecture seule
- Tester les accès directs API pour empêcher le contournement par modification d'id d'entrepôt
- Vérifier les règles métier critiques : stock insuffisant, seuils d'alerte, unicité email, affectation obligatoire d'entrepôt
- Revoir les erreurs API pour qu'elles soient compréhensibles et cohérentes
- Valider les cas de démo les plus importants avec des données stables, lisibles et cohérentes avec le contexte tunisien

**Frontend :**

- Parcours de démonstration complet par rôle
- Vérifier les redirections, menus et pages interdites selon le rôle
- Vérifier que les filtres d'entrepôt affichés correspondent réellement aux données autorisées
- Préparer une expérience de démo fluide avec des données assez riches pour montrer les KPI
- Vérifier les transitions de navigation, redirections et accès refusés

**Documentation :**

- Mettre à jour `docs/API.md` ou Swagger avec les endpoints finaux
- Ajouter une section courte expliquant la matrice des rôles et le filtrage par entrepôt
- Documenter les scénarios de démonstration recommandés pour chaque rôle
- Documenter les jeux de données de démonstration retenus, leurs rôles et les familles de produits utilisées
- Documenter la variable `STOCKPRO_DEMO_DATA` et le comportement attendu en mode démo versus mode normal

**Branch git :** `feature/phase-10-business-validation-security`

---

## Phase 11 — Tests et nettoyage final [DONE]

**Objectif :** valider la qualité fonctionnelle du code et terminer le nettoyage du projet avant la conteneurisation.

**Sous-étapes :**

### 11.1 — Backend tests [DONE]

**Stack recommandée :** `Spring Boot Test` + `JUnit 5` + `Mockito` + `MockMvc`

- tests unitaires des services métier avec mocks des repositories
- tests d’intégration des contrôleurs et de l’authentification avec le contexte Spring
- validation des règles critiques de sécurité et de données
- couverture des cas limites principaux : stock insuffisant, accès refusé, capacité, seuil d’alerte

### 11.2 — Frontend tests [DONE]

**Stack recommandée :** `Vitest` + `jsdom` + `Angular TestBed`

- tests unitaires des composants et services Angular
- tests de rendu et d’interaction dans un environnement `jsdom`
- vérification des parcours principaux, des guards et de l’accès selon les rôles
- vérification des états `loading`, `error` et `empty`
- maintien d’une base de tests simple, rapide et cohérente avec Angular 21

### 11.3 — Qualité et nettoyage [DONE]

- exécution du lint backend et frontend
- correction des derniers avertissements et incohérences
- suppression des artefacts, doublons et textes temporaires
- revue finale du `README.md` et de la documentation utile
- contrôle final des imports, formats et fichiers non utilisés
- s’assurer que les tests backend et frontend restent exécutables avec les scripts du projet

### 11.4 — Vérification infra finale [DONE]

- vérifier que toutes les tables ajoutées dans les phases 2 à 10 sont présentes dans `infra/mysql-init/01-schema.sql`
- vérifier la matrice des rôles sur les routes backend et frontend avant livraison finale

**Définition de done :**

- le backend est couvert par des tests unitaires et d’intégration ciblés
- le frontend utilise Vitest comme runner principal avec `jsdom`
- les parcours critiques sont validés par rôle et par comportement attendu
- le nettoyage final ne casse ni le build ni les tests

**Branch git :** `feature/phase-11-tests-cleanup`

---

## Phase 12 — Socle d’exécution locale et préparation du poste [DONE]

**Objectif :** rendre le projet exécutable en local sur un poste neuf, avec une base MySQL déjà accessible localement, sans dépendre d’une orchestration conteneurisée supplémentaire.

**Note de périmètre :** cette phase ne crée pas l’infrastructure MySQL ; elle prépare seulement le lancement local du backend et du frontend contre une base déjà joignable depuis la machine de développement (Docker exposé localement ou MySQL natif).

**Préparations à faire :**

- vérifier Git, Java 17, Node.js, npm et une instance MySQL joignable localement
- documenter les versions minimales requises
- créer ou compléter `.env.example`
- nettoyer le repo pour que seul le code source utile soit suivi
- définir les ports locaux, les variables d’environnement et la méthode de chargement des valeurs locales

**Travaux :**

- écrire un README de démarrage local clair
- rendre le backend lançable en local contre l’instance MySQL déjà accessible sur la machine
- rendre le frontend lançable en local sur un port fixe
- valider les scripts de lancement manuel
- vérifier que l’application démarre de bout en bout en local
- documenter la configuration de base de données locale, les comptes de test et les valeurs de connexion attendues
- documenter les dépendances minimales, les ports, les variables d’environnement et les commandes de démarrage local
- décrire la procédure de vérification locale sans Docker
- préciser comment activer ou désactiver le chargement des données de démo via les variables d’environnement
- clarifier dans le README si les variables sont fournies via un `.env` local, des exports shell ou la configuration de l’IDE

**Définition of done :**

- un nouveau clone peut suivre le README et lancer l’application en local
- backend et frontend démarrent sans configuration implicite cachée
- les variables sensibles restent hors du dépôt
- les dépendances locales minimales sont clairement listées
- le backend se connecte à une base MySQL déjà accessible localement avec une configuration explicitement documentée

**Sortie attendue :**

- application fonctionnelle en local
- base de référence pour toutes les phases suivantes

**Branch git :** `feature/devops-phase-12-local-baseline`

---

## Phase 13 — Conteneurisation complète [DONE]

**Objectif :** produire une stack Docker proche d’un usage production, reproductible et propre à déployer.

**Travaux :**

- créer un `Dockerfile` backend multi-stage, compact, basé sur un runtime Java de production
- créer un `Dockerfile` frontend multi-stage, servi par un runtime web léger
- ajouter les `.dockerignore` nécessaires pour garder des images propres
- définir un `docker-compose.yml` racine comme stack applicative principale avec `backend`, `frontend` et `mysql`
- exposer MySQL en local sur un port de développement réservé afin de permettre les outils d'administration comme phpMyAdmin sans dupliquer la base
- brancher le service MySQL racine sur `infra/mysql-init/01-schema.sql` comme bootstrap unique du schéma
- garder `mysql-init` comme source unique de bootstrap SQL, sans dupliquer la logique d'initialisation ailleurs
- externaliser les variables d’environnement nécessaires à l’exécution en conteneur, sans secrets en dur
- ajouter des volumes persistants, ports explicites, `restart: unless-stopped` et dépendances de démarrage utiles
- prévoir les healthchecks et vérifier l’ordre de démarrage réel entre services
- s’assurer que les conteneurs tournent avec des privilèges minimaux et des images non bavardes
- documenter les commandes de build et de lancement Docker dans le guide local
- valider que la base MySQL conserve ses données via un volume dédié
- vérifier que la stack peut être relancée de zéro sans étape manuelle cachée
- laisser les outils purement infra ou d’administration locale dans `infra/` ou dans un profil séparé, pas dans la stack applicative de base

**Définition of done :**

- l’application démarre via Docker sans lancement manuel des applications
- backend, frontend et base de données fonctionnent ensemble
- la base MySQL est initialisée automatiquement via les scripts SQL du projet au premier démarrage du volume
- les images peuvent être reconstruites à partir du repo
- un clone neuf peut lancer la stack conteneurisée avec une seule procédure documentée
- les ports et variables d’environnement restent cohérents avec le mode local
- la stack est lisible, maintenable et suffisamment proche d’un usage prod pour la soutenance

**Sortie attendue :**

- stack conteneurisée exécutable sur n’importe quelle machine avec Docker

**Branch git :** `feature/devops-phase-13-docker`

---

## Phase 14 — CI de base sur GitHub Actions

**Objectif :** automatiser une CI rapide, lisible et fiable sur les branches de travail et d'intégration.

**Principe de déclenchement recommandé :**

- exécuter la CI sur chaque `push` vers les branches `feature/**`, `dev` et `main`
- exécuter aussi la CI sur les `pull_request` ciblant `dev` et `main`
- garder `main` protégé avec une fusion uniquement après CI verte

**Périmètre CI :**

- vérifications rapides et répétables
- sans déploiement, sans scan avancé, sans publication d’artefacts métier
- même logique de contrôle sur backend et frontend

**Travaux :**

- créer `.github/workflows/ci.yml`
- définir des jobs séparés pour le backend et le frontend
- ajouter un job de préparation commun pour récupérer le code et configurer le cache
- mettre en cache les dépendances Maven et npm pour accélérer les exécutions successives
- installer les dépendances backend et frontend dans le pipeline
- lancer les tests backend et frontend
- lancer les builds backend et frontend
- exécuter le lint dans le pipeline
- vérifier le format et la cohérence de base avant les étapes lourdes
- faire échouer le pipeline en cas d’erreur
- documenter les statuts attendus et les branches couvertes par la CI

**Définition of done :**

- les branches `feature/**`, `dev` et `main` déclenchent une CI sur push
- les pull requests vers `dev` et `main` sont validées par la CI
- un code cassé bloque la fusion
- le pipeline reste lisible, maintenable et rapide grâce au cache
- le pipeline reflète les mêmes vérifications que le mode local

**Sortie attendue :**

- première chaîne CI fiable et visible sur GitHub

**Branch git :** `feature/devops-phase-14-ci-base`

---

## Phase 15 — Qualité logicielle et sécurité de pipeline

**Objectif :** renforcer la CI avec les contrôles qualité et sécurité exigés par le sujet.

**Travaux :**

- intégrer SonarQube ou SonarCloud
- ajouter un scan des dépendances
- ajouter un scan d’image Docker avec Trivy
- utiliser les GitHub Secrets pour les jetons et identifiants
- définir les seuils de blocage
- protéger les branches critiques avec les contrôles qualité
- documenter les règles de passage en vert du pipeline

**Définition of done :**

- les vulnérabilités critiques bloquent le pipeline
- la qualité du code est visible dans l’outillage
- les secrets ne sont jamais stockés en dur
- les contrôles qualité deviennent obligatoires avant fusion

**Sortie attendue :**

- pipeline CI sécurisé et exploitable pour la soutenance

**Branch git :** `feature/devops-phase-15-quality-security`

---

## Phase 16 — Déploiement Kubernetes local

**Objectif :** faire tourner la stack dans Kubernetes sans déploiement manuel hors manifests.

**Travaux :**

- choisir un environnement local de test Kubernetes : Minikube ou kind
- créer les manifests `Deployment`, `Service` et les ressources associées
- gérer les ConfigMaps et Secrets nécessaires
- valider le déploiement du backend, du frontend et de la base
- documenter la commande de bootstrap du cluster
- ajouter les probes de readiness/liveness et les ressources CPU/mémoire
- prévoir un namespace dédié à l’application

**Définition of done :**

- un cluster neuf peut recevoir l’application via les manifests
- l’application fonctionne dans Kubernetes en local
- aucune étape critique ne dépend d’un clic manuel dans l’interface
- le déploiement est reproductible à partir des manifests seuls

**Sortie attendue :**

- premier déploiement Kubernetes reproductible

**Branch git :** `feature/devops-phase-16-k8s`

---

## Phase 17 — GitOps et ArgoCD

**Objectif :** transformer le déploiement Kubernetes en flux GitOps.

**Travaux :**

- préparer le dossier `k8s/` comme source de vérité
- installer ArgoCD sur le cluster choisi
- définir l’application ArgoCD
- activer la synchronisation automatique
- vérifier qu’un commit Git déclenche la mise à jour du cluster
- organiser la structure GitOps pour distinguer base commune et overlays si nécessaire
- documenter le bootstrap initial d’ArgoCD et la première synchronisation

**Définition of done :**

- le déploiement provient du dépôt Git
- le cluster se synchronise automatiquement
- aucune commande manuelle de `kubectl apply` n’est nécessaire après le setup
- l’état réel du cluster reste aligné avec le dépôt

**Sortie attendue :**

- chaîne GitOps fonctionnelle et démontrable

**Branch git :** `feature/devops-phase-17-argocd`

---

## Phase 18 — Observabilité et alerting

**Objectif :** exposer des métriques et superviser réellement l’application.

**Travaux :**

- ajouter un endpoint de métriques côté backend
- intégrer Prometheus
- intégrer Grafana avec un dashboard utile
- ajouter des alerte simple et complexe
- documenter où récupérer les métriques et comment lire les tableaux de bord
- exposer quelques métriques métier utiles en plus des métriques techniques
- prévoir au moins une alerte d’application et une alerte d’infrastructure

**Définition of done :**

- les métriques sont collectées automatiquement
- le dashboard montre des données réelles
- une alerte de base peut être déclenchée
- les métriques et alertes sont compréhensibles pour une soutenance

**Sortie attendue :**

- observabilité complète de la stack

**Branch git :** `feature/devops-phase-18-observability`

---

## Phase 19 — Amélioration continue et finalisation soutenance

**Objectif :** stabiliser la solution et préparer la démonstration finale.

**Travaux :**

- identifier les points faibles restants
- corriger les frictions de build, déploiement ou supervision
- compléter le README final
- rédiger le document technique demandé
- préparer un scénario de démo reproductible
- ajouter les captures nécessaires
- geler le périmètre fonctionnel final
- vérifier la cohérence entre le plan, le code et la documentation
- préparer les derniers correctifs de stabilité et de présentation

**Définition of done :**

- chaque phase précédente est démontrable en quelques minutes
- le projet est propre, documenté et présentable
- la soutenance peut être suivie sans improvisation technique
- aucun écart majeur ne subsiste entre la documentation et l’implémentation

**Sortie attendue :**

- version finale prête pour dépôt et présentation

**Branch git :** `feature/devops-phase-19-finalization`

---
