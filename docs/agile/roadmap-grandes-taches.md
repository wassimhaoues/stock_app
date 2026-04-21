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
| 11    | Tests, Docker, nettoyage final                   | To do  | Packaging livrable             |
| 12    | Gestion Agile et backlog                         | To do  | Board et user stories          |
| 13    | Socle local et préparation du poste              | To do  | Lancement sur machine neuve    |
| 14    | Conteneurisation complète                        | To do  | Stack Docker reproductible     |
| 15    | CI GitHub Actions                                | To do  | Pipeline de base               |
| 16    | Qualité logicielle et sécurité pipeline          | To do  | Scans et quality gate          |
| 17    | Déploiement Kubernetes local                     | To do  | Manifests et cluster local     |
| 18    | GitOps et ArgoCD                                 | To do  | Sync automatique depuis Git    |
| 19    | Observabilité et alerting                        | To do  | Métriques et dashboards        |
| 20    | Amélioration continue et soutenance              | To do  | Version finale présentable     |

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

- enrichir les données de démo
- vérifier les parcours par rôle
- bloquer les contournements d'accès
- mettre à jour la documentation utile

### Phase 11 — Tests, Docker, nettoyage final

- ajouter les tests essentiels
- préparer les images Docker
- finaliser `docker-compose.yml`
- vérifier les contraintes et la matrice de rôles

## 3. Préparation Agile et industrialisation DevOps

### Phase 12 — Gestion Agile et backlog

- créer le board Agile
- définir les epics
- découper les phases en user stories
- fixer un workflow simple de suivi

### Phase 13 — Socle d'exécution locale

- valider les prérequis poste
- documenter les versions minimales
- rendre le lancement local clair et reproductible

### Phase 14 — Conteneurisation complète

- créer les Dockerfile backend et frontend
- orchestrer les services avec Docker Compose
- garantir un démarrage reproductible

### Phase 15 — CI de base

- ajouter GitHub Actions
- exécuter tests et builds à chaque push
- bloquer les erreurs de build

### Phase 16 — Qualité et sécurité pipeline

- intégrer l'analyse qualité
- ajouter les scans de dépendances et d'images
- protéger les secrets et seuils de blocage

### Phase 17 — Kubernetes local

- créer les manifests Kubernetes
- déployer backend, frontend et base
- documenter le bootstrap du cluster

### Phase 18 — GitOps et ArgoCD

- faire du dépôt la source de vérité
- activer la synchronisation automatique
- supprimer les déploiements manuels

### Phase 19 — Observabilité et alerting

- exposer les métriques applicatives
- intégrer Prometheus et Grafana
- ajouter des alertes exploitables

### Phase 20 — Finalisation soutenance

- corriger les derniers points faibles
- compléter la documentation finale
- préparer une démo reproductible

## 4. Lecture rapide

| Bloc             | Focus          |
| ---------------- | -------------- |
| Produit          | Phases 0 à 8   |
| Finition         | Phases 9 à 11  |
| Organisation     | Phase 12       |
| Exécution locale | Phase 13       |
| Conteneurisation | Phase 14       |
| CI/CD            | Phases 15 à 16 |
| Déploiement      | Phases 17 à 18 |
| Supervision      | Phase 19       |
| Livraison        | Phase 20       |
