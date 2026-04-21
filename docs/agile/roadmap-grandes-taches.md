# StockPro — Roadmap des grandes tâches

Ce document résume les grandes tâches du `Project_plan.md` en une vue simple, ordonnée et exploitable.

## Vue d'ensemble

| Phase | Grand objectif                                   | Statut | Livrable principal             |
| ----- | ------------------------------------------------ | ------ | ------------------------------ |
| 0     | Planification et décisions techniques            | Done   | Socle de cadrage               |
| 1     | Fondations backend et frontend                   | Done   | Structure initiale             |
| 2     | Authentification et sécurité                     | Done   | Login JWT et protection        |
| 3     | Administration des utilisateurs                  | Done   | CRUD utilisateurs et rôles     |
| 4     | Gestion des entrepôts                            | Done   | CRUD entrepôts                 |
| 5     | Gestion des produits                             | Done   | CRUD produits                  |
| 6     | Stocks et mouvements                             | Done   | Gestion opérationnelle         |
| 7     | Capacité des entrepôts                           | Done   | Contraintes métier de capacité |
| 8     | Alertes et dashboard analytique                  | Done   | Pilotage métier                |
| 9     | Revue UX/UI frontend                             | To do  | Interface professionnelle      |
| 10    | Validation métier, sécurité et données réalistes | To do  | Démo crédible et sécurisée     |
| 11    | Tests et nettoyage final                         | To do  | Qualité et stabilisation       |
| 12    | Socle local et préparation du poste              | To do  | Lancement local reproductible  |
| 13    | Conteneurisation complète                        | To do  | Stack Docker reproductible     |
| 14    | CI GitHub Actions                                | To do  | Pipeline de base               |
| 15    | Qualité logicielle et sécurité pipeline          | To do  | Scans et quality gate          |
| 16    | Déploiement Kubernetes local                     | To do  | Manifests et cluster local     |
| 17    | GitOps et ArgoCD                                 | To do  | Sync automatique depuis Git    |
| 18    | Observabilité et alerting                        | To do  | Métriques et dashboards        |
| 19    | Amélioration continue et soutenance              | To do  | Version finale présentable     |

## 1. Socle produit déjà en place

- authentification sécurisée
- gestion des utilisateurs, rôles et affectations
- gestion des entrepôts et du catalogue produits
- gestion des stocks et des mouvements
- règles de capacité et d’alertes
- dashboard métier

## 2. Finition produit

### Phase 9 — Revue UX/UI frontend

- moderniser toutes les pages
- supprimer les textes de prototype
- harmoniser les tableaux, formulaires et états d'interface
- garantir une expérience professionnelle en français

### Phase 10 — Validation métier, sécurité et données réalistes

- ajouter un mode démo activable par variable d'environnement
- garder la base propre en mode normal avec seulement un ADMIN minimal
- enrichir les données de démo avec un contexte tunisien
- utiliser des noms tunisiens pour les personnes, les entrepôts et les lieux
- limiter les produits aux familles informatique, gaming, téléphonie, TV, photo, son et électroménager
- utiliser des noms de produits réels et crédibles
- vérifier les parcours par rôle
- bloquer les contournements d'accès
- mettre à jour la documentation utile

### Phase 11 — Tests et nettoyage final

- 11.1 backend: JUnit 5, Mockito, Spring Boot Test, MockMvc
- 11.2 frontend: Vitest, jsdom, Angular TestBed
- 11.3 lint, cleanup et documentation
- 11.4 vérification infra finale
- vérifier les contraintes et la matrice de rôles

## 3. Préparation Agile et industrialisation DevOps

### Phase 12 — Socle d'exécution locale

- valider les prérequis poste
- documenter les versions minimales
- confirmer le fonctionnement local avec MySQL
- rendre le lancement local clair et reproductible
- documenter les commandes et la configuration locale sans Docker
- préciser les variables d'environnement qui contrôlent le mode démo et le mode normal

### Phase 13 — Conteneurisation complète

- multi-stage Dockerfiles backend et frontend
- docker-compose racine comme stack applicative principale
- bootstrap MySQL via `infra/mysql-init/01-schema.sql`
- volumes persistants, healthchecks et redémarrage propre

### Phase 14 — CI de base

- GitHub Actions sur feature/dev/main + PR vers dev/main
- backend/frontend en jobs séparés
- cache Maven et npm
- tests, builds, lint et format

### Phase 15 — Qualité et sécurité pipeline

- intégrer l'analyse qualité
- ajouter les scans de dépendances et d'images
- protéger les secrets et seuils de blocage

### Phase 16 — Kubernetes local

- créer les manifests Kubernetes
- déployer backend, frontend et base
- ajouter les probes et resources
- documenter le bootstrap du cluster

### Phase 17 — GitOps et ArgoCD

- faire du dépôt la source de vérité
- activer la synchronisation automatique
- supprimer les déploiements manuels

### Phase 18 — Observabilité et alerting

- exposer les métriques applicatives
- intégrer Prometheus et Grafana
- ajouter des alertes exploitables

### Phase 19 — Finalisation soutenance

- corriger les derniers points faibles
- compléter la documentation finale
- préparer une démo reproductible

## 4. Lecture rapide

| Bloc             | Focus          |
| ---------------- | -------------- |
| Produit          | Phases 0 à 8   |
| Finition         | Phases 9 à 11  |
| Exécution locale | Phase 12       |
| Conteneurisation | Phase 13       |
| CI/CD            | Phases 14 à 15 |
| Déploiement      | Phases 16 à 17 |
| Supervision      | Phase 18       |
| Livraison        | Phase 19       |
