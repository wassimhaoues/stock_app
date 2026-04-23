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
| 14    | CI de base sur GitHub Actions                    | DONE   |
| 15    | Qualité logicielle et sécurité de pipeline       | DONE   |
| 16    | Déploiement Kubernetes local                     | DONE   |
| 17    | GitOps et ArgoCD                                 | DONE   |
| 18    | CD automatisé par image versionnée               | DONE   |
| 19    | Logging centralisé backend                       | DONE   |
| 20    | Observabilité et alerting                        | TODO   |
| 21    | Finalisation et soutenance                       | TODO   |

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

## Phase 14 — CI de base sur GitHub Actions [DONE]

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

## Phase 15 — Qualité logicielle et sécurité de pipeline [DONE]

**Objectif :** transformer la CI en vrai quality gate de production pour le backend Spring Boot, le frontend Angular et la stack Docker.

**Stack recommandée :**

- **Analyse qualité principale :** SonarCloud
- **SAST complémentaire :** GitHub CodeQL sur Java et TypeScript
- **Vulnérabilités dépendances backend :** OWASP Dependency-Check ou équivalent Maven compatible
- **Vulnérabilités dépendances frontend :** audit npm au niveau de sévérité `high` et `critical`
- **Scan images Docker :** Trivy
- **Protection de branches :** GitHub branch protection rules sur `dev` et `main`

**Principes de la phase :**

- bloquer les régressions de qualité avant qu’elles n’atteignent `dev` ou `main`
- garder le pipeline lisible, rapide et exploitable par un jury
- faire reposer la décision finale sur des seuils objectifs et documentés
- ne pas dupliquer les règles de la phase 14 ; cette phase ajoute les contrôles de sécurité et de qualité avancés

**Préparation administrateur déjà effectuée :**

- GitHub Actions activé
- secrets GitHub configurés : `SONAR_TOKEN`, `JWT_SECRET`, variables MySQL et variables de base de données
- variables d’environnement GitHub configurées pour `DB_NAME` et `DB_USERNAME`
- règles de protection de branche configurées sur `dev` et `main`
- pull request requise avant fusion
- status checks obligatoires avant fusion
- branche à jour requise avant fusion

**Travaux :**

- intégrer SonarCloud comme gate principal avec Quality Gate bloquant
- ajouter CodeQL sur les langages du projet pour détecter les failles courantes côté code
- ajouter un scan des dépendances backend côté Maven et frontend côté npm
- ajouter un scan d’image Docker avec Trivy sur les images construites par la CI
- définir des seuils de blocage clairs pour les bugs, vulnérabilités et dettes techniques
- faire tourner les scans uniquement sur les branches et événements pertinents pour éviter le bruit
- archiver les rapports de qualité de manière exploitable dans GitHub Actions
- documenter les règles de passage en vert du pipeline et l’interprétation des rapports
- garder cette phase compatible avec la stack actuelle : Spring Boot, Maven, Angular, npm et Docker

**Définition of done :**

- toute vulnérabilité critique détectée par les scans bloque la fusion
- le Quality Gate SonarCloud est obligatoire sur `dev` et `main`
- les branches protégées refusent la fusion si les contrôles qualité échouent
- les secrets restent uniquement dans GitHub Secrets et jamais dans le dépôt
- les rapports de qualité et de sécurité sont lisibles et exploitables
- la CI reste cohérente avec les contraintes du projet et ne ralentit pas inutilement le flux de travail

**Sortie attendue :**

- pipeline CI sécurisé et exploitable pour la soutenance

**Branch git :** `feature/devops-phase-15-quality-security`

---

## Phase 16 — Déploiement Kubernetes local [DONE]

**Objectif :** préparer les manifests Kubernetes locaux pour la stack, puis laisser le déploiement manuel à l’apprenant pour apprendre le flux de bout en bout.

**Stack recommandée :**

- **Cluster local :** kind
- **CLI :** kubectl
- **État local actuel :** kind et kubectl sont déjà installés, et un cluster kind est déjà créé (`kubectl cluster-info --context kind-stockpro`)
- **Organisation des manifests :** kustomize avec `k8s/base` et `k8s/overlays/local`
- **Images locales :** build Docker puis chargement dans kind pour éviter un registry externe pendant la phase
- **Stockage base :** PVC dédié pour MySQL

**Périmètre de cette phase :**

- l’agent crée uniquement les fichiers Kubernetes et la documentation associée
- le déploiement réel, le chargement des images et la validation du cluster sont effectués manuellement par l’apprenant
- un guide séparé décrit exactement les commandes à exécuter après la génération des fichiers

**Principes de la phase :**

- garder les manifests simples, lisibles et réutilisables pour la phase 17
- rappeler que les Dockerfiles servent à construire les images, puis que Kubernetes lance ces images dans des pods
- ne plus utiliser Docker Compose comme mécanisme principal de démarrage pour cette phase
- commenter chaque fichier de manifeste avec une explication courte et précise de ce qu’il sert, pourquoi il existe et comment il s’intègre dans le flux de déploiement
- séparer clairement `ConfigMap` (non sensible) et `Secret` (DB, JWT)
- utiliser des noms de services stables pour rester compatible avec le proxy nginx du frontend et la configuration backend actuelle
- exposer uniquement ce qui doit l’être depuis l’extérieur ; garder MySQL et le backend en `ClusterIP`
- définir `readinessProbe`, `livenessProbe` et des ressources CPU/mémoire sur chaque composant
- utiliser des labels homogènes (`app.kubernetes.io/*`) pour faciliter le suivi et les futures évolutions GitOps
- éviter toute valeur `latest` ou toute configuration implicite difficile à reproduire

**Travaux :**

- créer une arborescence `k8s/` structurée par couche :
  - `k8s/base/namespace.yaml`
  - `k8s/base/mysql/`
  - `k8s/base/backend/`
  - `k8s/base/frontend/`
  - `k8s/overlays/local/kustomization.yaml`
- déployer MySQL 8.0 avec un `StatefulSet` ou un `Deployment` adapté, un `Service`, un `PVC` et l’initialisation du schéma à partir de `infra/mysql-init/01-schema.sql`
- déployer le backend Spring Boot avec `Deployment`, `Service`, variables d’environnement issues de `ConfigMap` et `Secret`, et probes basées sur `/api/health`
- déployer le frontend Angular/Nginx avec `Deployment` et `Service`, en gardant le routage `/api/` vers le service backend
- prévoir un accès local simple au frontend via un port stable documenté ou un `port-forward` explicite
- éviter les manifestes trop “magiques” : chaque fichier doit rester lisible sans connaissance préalable poussée de Kubernetes
- créer un guide manuel séparé qui explique les étapes à exécuter après génération des fichiers
- faire en sorte que le guide couvre le build des images, leur chargement dans kind, l’application des manifests et la vérification du résultat

**Définition of done :**

- les manifests Kubernetes de base sont créés et cohérents
- chaque fichier de manifeste est commenté avec son rôle, son utilité et sa place dans le flux de déploiement
- un guide manuel séparé existe pour exécuter le déploiement après génération des fichiers
- la structure des manifests est prête à être reprise telle quelle pour la phase 17

**Sortie attendue :**

- premier déploiement Kubernetes local reproductible

**Branch git :** `feature/devops-phase-16-k8s`

---

## Phase 17 — GitOps et ArgoCD `[DONE]`

**Objectif :** transformer le déploiement Kubernetes en flux GitOps, avec des fichiers prêts à l’emploi puis une installation ArgoCD faite manuellement par l’apprenant.

**Périmètre de cette phase :**

- l’agent prépare les fichiers GitOps, les manifests ArgoCD et la documentation associée
- l’apprenant exécute lui-même les commandes kubectl/argocd pour installer et vérifier ArgoCD
- aucun déploiement automatique ne doit être présumé sans validation humaine

**Stack recommandée :**

- **GitOps controller :** ArgoCD
- **Source de vérité :** dossier `k8s/`
- **Organisation :** base commune + overlay local si nécessaire
- **Accès initial :** port-forward ou Ingress local simple pour l’UI ArgoCD

**Principes de la phase :**

- conserver la structure `k8s/` déjà créée en phase 16 comme base GitOps
- ne pas dupliquer inutilement les manifests applicatifs, mais les réutiliser via ArgoCD
- garder les fichiers lisibles et expliqués pour qu’un débutant comprenne ce qu’ArgoCD lit et applique
- documenter le bootstrap initial, la première synchronisation et la vérification du drift
- laisser les commandes d’installation et de validation à l’apprenant pour l’apprentissage

**Travaux :**

- préparer le dossier `k8s/` comme source de vérité GitOps
- créer les manifests ArgoCD nécessaires (`Application`, namespaces, accès UI si utile)
- documenter les commandes manuelles pour installer ArgoCD dans le cluster existant
- définir l’application ArgoCD sur le dépôt et l’overlay appropriés
- activer la synchronisation automatique avec prudence après la première synchro manuelle
- organiser la structure GitOps pour distinguer base commune et overlays si nécessaire
- documenter comment vérifier que le cluster suit bien le dépôt Git
- prévoir une procédure simple pour accéder à l’interface ArgoCD en local
- si de nouveaux fichiers sont nécessaires, les créer sans modifier le code applicatif

**Définition of done :**

- le cluster peut être installé et synchronisé à partir du dépôt Git
- l’application ArgoCD est définie et fonctionnelle
- la première synchronisation est reproductible et documentée
- la synchronisation automatique peut être activée après validation initiale
- l’état réel du cluster reste aligné avec le dépôt

**Sortie attendue :**

- chaîne GitOps fonctionnelle et démontrable

**Branch git :** `feature/devops-phase-17-argocd`

---

## Phase 18 — CD automatisé par image versionnée `[DONE]`

**Objectif :** supprimer les actions manuelles après un changement de code en automatisant la chaîne code -> image versionnée -> GitOps -> déploiement.

**Périmètre de la phase :**

- l’agent prépare les fichiers, les workflows et la documentation nécessaires pour automatiser la mise à jour des images et du déploiement
- l’apprenant exécute lui-même les commandes de build, push et vérification pendant l’apprentissage
- le flux doit s’appuyer sur la CI existante, le dépôt Git, GitHub Container Registry et ArgoCD déjà en place
- aucun changement de code ne doit rester dépendant d’un `kubectl apply` manuel une fois la phase terminée

**Stack recommandée :**

- **Registry d’images :** GitHub Container Registry
- **Authentification registre :** `GITHUB_TOKEN` dans GitHub Actions
- **Mise à jour GitOps :** bump explicite du tag d’image dans le dépôt
- **Déclenchement :** workflow GitHub Actions sur `main`
- **Synchronisation :** ArgoCD en auto-sync sur `main`

**Flux cible :**

1. Un changement de code est fusionné dans `main`.
2. La CI exécute tests, qualité et sécurité.
3. Un job de publication construit les images frontend/backend.
4. Le job pousse les images dans GHCR avec un tag unique, par exemple le SHA du commit.
5. Le même flux met à jour le tag référencé dans le dépôt GitOps (`k8s/overlays/gitops`).
6. ArgoCD détecte le changement Git sur `main`.
7. ArgoCD synchronise le cluster et remplace les pods avec la nouvelle image.
8. La version déployée peut être vérifiée dans Kubernetes et dans GHCR.

**Principes de la phase :**

- partir du constat que la CI et la sécurité existent déjà
- automatiser ce qui manque encore : publication d’une nouvelle image et déclenchement d’un déploiement GitOps
- garder le mécanisme lisible pour un débutant : code change -> image versionnée -> manifeste mis à jour -> ArgoCD sync
- éviter les tags vagues comme `local` pour le flux automatisé final
- conserver le déploiement local kind comme environnement d’apprentissage, sans le confondre avec le flux automatisé final
- garder une séparation claire entre le flux local de phase 16/17 et le flux automatisé final de cette phase

**Travaux :**

- définir la stratégie de version d’image à partir du commit SHA ou d’un tag de release
- préparer ou ajuster les workflows GitHub Actions pour builder et publier les images backend/frontend
- ajouter un job de publication sur `main` après les jobs de tests et de qualité
- faire en sorte que le pipeline produise un tag unique par version livrée
- mettre à jour le manifest GitOps pour consommer le bon tag d’image
- documenter comment le flux GitHub Actions met à jour le dépôt GitOps sans commande manuelle de `kubectl apply`
- documenter le point de contrôle final : visibilité du tag dans GHCR, mise à jour du YAML, sync ArgoCD, pods recréés
- préciser ce qui reste manuel pendant l’apprentissage local et ce qui devient automatisé dans le flux final
- si de nouveaux fichiers sont nécessaires, les créer sans toucher au code applicatif

**Définition of done :**

- une modification de code mergée sur `main` peut produire une nouvelle image versionnée
- le tag d’image consommé par Kubernetes est mis à jour de façon traçable dans Git
- ArgoCD synchronise automatiquement le cluster après la mise à jour Git
- le flux code -> image -> Git -> cluster est expliqué, documenté et reproductible

**Sortie attendue :**

- boucle CD automatisée et traçable

**Branch git :** `feature/devops-phase-18-cd-automation`

---

## Phase 19 — Logging centralisé backend [DONE]

**Objectif :** instrumenter tout le backend avec un système de logging cohérent, contextuel et exploitable, afin que la phase 20 puisse collecter, visualiser et alerter sur des données réelles.

**Constat de départ :**

- le backend ne contient actuellement aucun appel de log (`@Slf4j`, `log.*`) et aucune configuration Logback
- les exceptions dans `GlobalExceptionHandler` sont silencieuses : les erreurs 500 ne laissent aucune trace exploitable
- `JwtAuthFilter` ne signale pas les tokens invalides ou expirés
- les opérations métier critiques (ENTREE/SORTIE de stock, rejets de capacité, créations d’utilisateurs) ne sont pas tracées
- Lombok est déjà utilisé dans le projet (`@RequiredArgsConstructor`) : `@Slf4j` est disponible sans dépendance supplémentaire
- Spring Boot embarque Logback par défaut : aucune dépendance externe n’est nécessaire

**Périmètre de la phase :**

- l’agent crée tous les fichiers de configuration et modifie les classes Java concernées
- aucune logique métier ne doit être modifiée, uniquement des appels de log ajoutés
- les travaux manuels de vérification restent à la charge de l’apprenant

**Stack de logging :**

- **Logger :** SLF4J + Logback (déjà embarqué dans Spring Boot)
- **Annotation :** `@Slf4j` de Lombok sur chaque classe concernée
- **Contexte par requête :** MDC (Mapped Diagnostic Context) via un filtre HTTP dédié
- **Format local :** pattern lisible en console (timestamp, niveau, correlationId, logger court, message)
- **Format Docker/Kubernetes :** même pattern ou JSON structuré selon profil Spring Boot actif

---

**Travaux de l’agent :**

### 1 — Configuration Logback

- créer `src/main/resources/logback-spring.xml` avec :
  - un appender console avec pattern : `%d{HH:mm:ss.SSS} %-5level [%X{correlationId}] [%X{userEmail}] %logger{30} - %msg%n`
  - profil `docker` et profil `k8s` avec format JSON structuré (champs : `timestamp`, `level`, `correlationId`, `userEmail`, `logger`, `message`, `exception` si présente)
  - niveau racine `INFO`, niveau `DEBUG` pour `com.wassim.stock` en profil `dev` uniquement
- ajouter dans `application.properties` :
  ```
  logging.level.root=INFO
  logging.level.com.wassim.stock=INFO
  logging.level.org.springframework.security=WARN
  logging.level.org.hibernate.SQL=WARN
  ```
- ajouter dans `application-dev.properties` :
  ```
  logging.level.com.wassim.stock=DEBUG
  logging.level.org.hibernate.SQL=DEBUG
  ```

### 2 — Filtre MDC de corrélation de requête

- créer `com.wassim.stock.logging.RequestCorrelationFilter` (implémente `OncePerRequestFilter`) :
  - génère un `correlationId` UUID court (8 premiers caractères) par requête
  - extrait l’email de l’utilisateur depuis `SecurityContextHolder` si authentifié, `anonymous` sinon
  - place `correlationId` et `userEmail` dans le MDC en début de requête
  - nettoie le MDC en fin de requête (`MDC.clear()` dans le bloc `finally`)
  - ajoute `X-Correlation-Id` dans l’en-tête HTTP de la réponse pour traçabilité front/back

### 3 — Intégration dans les classes existantes

Ajouter `@Slf4j` et les appels de log suivants, sans modifier la logique métier :

**`GlobalExceptionHandler`** :
- `log.warn(“Ressource non trouvée : {}”, ex.getMessage())` sur `ResourceNotFoundException`
- `log.warn(“Requête invalide : {}”, ex.getMessage())` sur `BadRequestException` et `ConflictException`
- `log.warn(“Accès refusé pour {}”, MDC.get(“userEmail”))` sur `AccessDeniedException`
- `log.warn(“Échec d’authentification”)` sur `BadCredentialsException` (pas de détail dans le log)
- `log.error(“Erreur interne non gérée”, ex)` sur `Exception` générique (stack trace complète utile ici)

**`JwtAuthFilter`** :
- `log.debug(“Token JWT absent dans la requête vers {}”, request.getRequestURI())` quand token null
- `log.warn(“Token JWT invalide ou expiré sur {}”, request.getRequestURI())` quand `isTokenValid` échoue

**`AuthService` ou `AuthController`** :
- `log.info(“Connexion réussie pour {}”, email)` après login accepté
- `log.warn(“Échec de connexion pour {}”, email)` après `BadCredentialsException`

**`StockService`** :
- `log.info(“Stock créé : produit={}, entrepot={}, quantite={}”, produitId, entrepotId, quantite)` à la création
- `log.info(“Stock mis à jour : id={}, nouvelle quantite={}”, stockId, quantite)` à la modification
- `log.warn(“Création de stock refusée : capacité insuffisante (disponible={}, demandé={})”, dispo, demande)` sur rejet capacité

**`MouvementStockService`** :
- `log.info(“Mouvement {} enregistré : produit={}, entrepot={}, quantite={}”, type, produitId, entrepotId, quantite)` à chaque mouvement accepté
- `log.warn(“Mouvement SORTIE refusé : stock insuffisant (disponible={}, demandé={})”, dispo, demande)` sur rejet stock
- `log.warn(“Mouvement ENTREE refusé : capacité insuffisante (disponible={}, demandé={})”, dispo, demande)` sur rejet capacité

**`DataInitializer`** :
- `log.info(“Données de démo chargées : {} utilisateurs, {} entrepôts, {} produits”, ...)` en mode démo
- `log.info(“Compte admin initial créé”)` en mode normal

**Règles communes à tous les appels de log :**
- ne jamais logger un token JWT, un mot de passe, un cookie ou toute valeur de secret
- utiliser `log.warn` pour les cas métier rejetés (400, 403, 404, 409), `log.error` uniquement pour les exceptions inattendues (500)
- ne pas ajouter de log dans les repositories ou les entités
- ne pas dupliquer un log si l’exception est déjà loggée plus haut dans la chaîne d’appel

### 4 — Documentation

- créer `docs/09-operations/logging.md` :
  - table des niveaux de log et leur signification dans ce projet
  - liste des événements loggés et à quel niveau
  - comment lire les logs en local, en Docker et en Kubernetes
  - explication du `correlationId` et comment le retrouver dans les logs
- créer `docs/13-manual-work/phase-19-logging-verification.md` :
  - commandes pour lancer le backend et observer les logs : `mvn spring-boot:run`, `docker compose logs -f backend`, `kubectl logs -f deployment/stockpro-backend -n stockpro`
  - scénarios de vérification : login réussi, login échoué, accès refusé, ENTREE de stock, SORTIE refusée, erreur 500 simulée
  - checklist pour confirmer l’absence de données sensibles dans les logs

---

**Règles de sécurité des logs :**

- aucun token JWT, aucun mot de passe, aucune valeur de cookie ne doit apparaître dans un log
- les emails utilisateurs peuvent être loggés au niveau `INFO` ou supérieur comme identifiant métier non sensible
- les identifiants numériques (ids produit, entrepôt, stock) sont acceptés dans les logs
- les stack traces complètes ne sont autorisées qu’au niveau `ERROR` (`log.error(“...”, ex)`)

---

**Définition of done :**

- `GlobalExceptionHandler` logue toutes les exceptions avec le niveau approprié
- `JwtAuthFilter` logue les tokens invalides en `WARN`
- `StockService` et `MouvementStockService` tracent chaque opération critique acceptée ou refusée
- le `correlationId` apparaît dans chaque ligne de log associée à une requête HTTP
- aucun secret, token ou mot de passe n’est visible dans les logs
- les logs sont lisibles en local et compatibles avec une collecte Docker / Kubernetes en phase 20
- `docs/09-operations/logging.md` et le fichier de travaux manuels sont créés
- `mvn test` et `npm run build` passent sans régression

**Sortie attendue :**

- backend avec des logs réellement exploitables pour le diagnostic et la future observabilité de la phase 20

**Branch git :** `feature/devops-phase-19-centralized-logging`

---

## Phase 20 — Observabilité et alerting [TODO]

**Objectif :** exposer des métriques techniques et métier depuis le backend, les collecter avec Prometheus, les visualiser dans Grafana et déclencher des alertes simples — en s’appuyant sur les logs structurés mis en place à la phase 19.

**Prérequis :** phase 19 terminée — le backend produit des logs cohérents avec `correlationId`, niveau et contexte utilisateur, exploitables par un système de collecte.

**Périmètre de la phase :**

- l’agent prépare tous les fichiers de configuration, les dépendances backend et les manifests ou fichiers de déploiement
- l’apprenant lance lui-même les commandes d’installation, d’application des manifests et de vérification
- aucune mesure ne doit rester “implicite” : chaque métrique ou alerte doit avoir une source claire et une façon de la tester

**Stack recommandée :**

- **Instrumentation backend :** Spring Boot Actuator + Micrometer (dépendances à ajouter dans `pom.xml`)
- **Endpoint de scraping :** `/actuator/prometheus` exposé par Micrometer
- **Collecte métriques :** Prometheus
- **Visualisation :** Grafana
- **Alerting :** règles Prometheus AlertManager ou alertes Grafana natives
- **Logs (optionnel) :** Grafana Loki pour agréger les logs structurés de la phase 19 dans le même tableau de bord
- **Organisation :** `infra/monitoring/` pour les fichiers de configuration Prometheus, Grafana et Loki

**Principes de la phase :**

- garder un périmètre simple et démontrable en soutenance
- privilégier des métriques compréhensibles : requêtes HTTP par code de statut, santé applicative, latence, JVM, erreurs
- les logs structurés de la phase 19 sont déjà prêts à être ingérés par Loki si l’apprenant choisit d’aller jusque là
- distinguer clairement métriques techniques (JVM, HTTP, DB pool) et métriques métier (mouvements de stock, alertes actives)
- documenter comment lire un dashboard, comment vérifier qu’une alerte se déclenche et comment interpréter une anomalie

**Travaux de l’agent :**

### 1 — Instrumentation backend

- ajouter dans `pom.xml` :
  - `spring-boot-starter-actuator`
  - `micrometer-registry-prometheus`
- configurer dans `application.properties` :
  ```
  management.endpoints.web.exposure.include=health,info,prometheus,metrics
  management.endpoint.health.show-details=when_authorized
  management.metrics.tags.application=stockpro
  ```
- sécuriser `/actuator/prometheus` pour qu’il reste accessible depuis Prometheus (autoriser sans auth ou via IP interne selon l’environnement)
- ajouter des compteurs métier personnalisés dans `MouvementStockService` via `MeterRegistry` :
  - `stockpro.mouvements.total` avec tag `type=ENTREE|SORTIE`
  - `stockpro.mouvements.rejets` avec tag `raison=stock_insuffisant|capacite_depassee`
- ne pas modifier la logique métier, uniquement ajouter les enregistrements de métriques

### 2 — Configuration Prometheus

- créer `infra/monitoring/prometheus/prometheus.yml` :
  - scraping de `/actuator/prometheus` sur le backend toutes les 15 secondes
  - scraping de l’endpoint de métriques MySQL si disponible
  - labels communs : `env=local`, `app=stockpro`
- créer `infra/monitoring/prometheus/rules/stockpro_alerts.yml` avec au moins :
  - alerte `BackendDown` : backend injoignable depuis 1 minute
  - alerte `HighErrorRate` : taux d’erreurs HTTP 5xx > 5% sur 5 minutes
  - alerte `StockRejectionsSpike` : plus de 10 rejets de mouvements en 5 minutes

### 3 — Dashboard Grafana

- créer `infra/monitoring/grafana/provisioning/dashboards/stockpro.json` avec :
  - panel : requêtes HTTP par statut (200, 400, 401, 403, 404, 409, 500) sur les dernières 30 minutes
  - panel : latence moyenne et p95 des requêtes backend
  - panel : santé de la JVM (heap utilisée, threads actifs, GC)
  - panel : compteur de mouvements ENTREE/SORTIE par heure
  - panel : compteur de rejets de mouvements (stock insuffisant, capacité)
  - panel : état de l’alerte `BackendDown`
- créer `infra/monitoring/grafana/provisioning/datasources/prometheus.yml` pointant vers Prometheus

### 4 — Déploiement local (Docker ou Kubernetes)

**Option Docker Compose :** créer `infra/monitoring/docker-compose.monitoring.yml` avec les services `prometheus` et `grafana` branchés sur le réseau applicatif existant du `docker-compose.yml` principal

**Option Kubernetes :** créer les manifests dans `k8s/base/monitoring/` : Deployment + Service pour Prometheus et Grafana, ConfigMap pour `prometheus.yml` et les règles d’alerte, PVC pour la persistance Grafana

L’agent prépare les deux options et documente le choix recommandé pour la soutenance.

### 5 — Documentation

- créer `docs/09-operations/observability.md` :
  - liste des métriques exposées et leur signification
  - description de chaque panel du dashboard Grafana
  - description de chaque règle d’alerte et son seuil
  - comment interpréter un pic d’erreurs ou un rejet de mouvement dans Grafana
  - lien avec les logs phase 19 : comment croiser un `correlationId` vu dans Grafana avec les logs Kubernetes/Docker
- créer `docs/13-manual-work/phase-20-observability-setup.md` :
  - commandes pour lancer la stack monitoring en local
  - commandes pour appliquer les manifests Kubernetes monitoring
  - comment vérifier que Prometheus scrape bien le backend (`/api/actuator/prometheus`)
  - comment importer le dashboard Grafana ou vérifier le provisioning automatique
  - scénario pour déclencher manuellement l’alerte `BackendDown` et observer le résultat dans Grafana

---

**Définition of done :**

- `/actuator/prometheus` répond avec des métriques valides sur le backend en cours d’exécution
- Prometheus scrape le backend et stocke les métriques sans erreur
- Grafana affiche des données réelles depuis Prometheus
- les compteurs métier `stockpro.mouvements.total` et `stockpro.mouvements.rejets` remontent dans Grafana
- au moins une alerte Prometheus peut être déclenchée et observée
- la documentation d’observabilité est complète et lisible pour une présentation en soutenance
- `mvn test` et `npm run build` passent sans régression

**Sortie attendue :**

- observabilité complète et démontrable de la stack, avec corrélation possible entre métriques (Prometheus/Grafana) et logs (phase 19)

**Branch git :** `feature/devops-phase-20-observability`

---

## Phase 21 — Finalisation et soutenance [TODO]

**Objectif :** stabiliser la solution complète et préparer une démonstration finale reproductible et professionnelle.

**Travaux :**

- identifier les points faibles restants après les phases 19 et 20
- corriger les frictions de build, déploiement ou supervision
- compléter le README final avec le parcours complet de démarrage
- rédiger le document technique requis pour la soutenance
- préparer un scénario de démo reproductible par rôle et par phase
- ajouter les captures d’écran nécessaires (dashboard Grafana, pipeline CI/CD, cluster Kubernetes, interface applicative)
- geler le périmètre fonctionnel final
- vérifier la cohérence entre le plan, le code, les logs, les métriques et la documentation
- préparer les derniers correctifs de stabilité et de présentation

**Définition of done :**

- chaque phase précédente est démontrable en quelques minutes
- le projet est propre, documenté et présentable
- la soutenance peut être suivie sans improvisation technique
- aucun écart majeur ne subsiste entre la documentation et l’implémentation

**Sortie attendue :**

- version finale prête pour dépôt et présentation

**Branch git :** `feature/devops-phase-21-finalization`

---
