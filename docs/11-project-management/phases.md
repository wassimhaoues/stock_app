# StockPro — Phases du projet

Ce document résume les grandes étapes du projet telles qu'elles ont été menées. Le but est de garder une vue simple du chemin parcouru, sans entrer dans des détails trop fins.

## Vue d'ensemble

| Phase | Intitulé                                      | Statut  |
| ----- | --------------------------------------------- | ------- |
| 0     | Planification et cadrage                      | Terminé |
| 1     | Mise en place du backend et du frontend       | Terminé |
| 2     | Authentification et sécurité                  | Terminé |
| 3     | Gestion des utilisateurs et rôles             | Terminé |
| 4     | Gestion des entrepôts                         | Terminé |
| 5     | Gestion des produits                          | Terminé |
| 6     | Gestion des stocks et mouvements              | Terminé |
| 7     | Gestion de la capacité des entrepôts          | Terminé |
| 8     | Alertes et tableau de bord                    | Terminé |
| 9     | Reprise de l'interface utilisateur            | Terminé |
| 10    | Validation métier et données de démonstration | Terminé |
| 11    | Tests et nettoyage                            | Terminé |
| 12    | Préparation de l'exécution locale             | Terminé |
| 13    | Conteneurisation Docker                       | Terminé |
| 14    | CI de base avec GitHub Actions                | Terminé |
| 15    | Qualité logicielle et sécurité pipeline       | Terminé |
| 16    | Déploiement Kubernetes local                  | Terminé |
| 17    | GitOps et ArgoCD                              | Terminé |
| 18    | CD automatisé avec publication d'images       | Terminé |
| 19    | Logging centralisé                            | Terminé |
| 20    | Observabilité et alerting                     | Terminé |
| 21    | Améliorations backend et finition frontend    | Terminé |
| 22    | Gouvernance CI/CD et flux GitOps par PR       | Terminé |
| 23    | Finalisation et préparation de soutenance     | Terminé |

## Détail des phases

### Phase 0 — Planification et cadrage

- Définition du périmètre fonctionnel.
- Choix de la stack technique.
- Mise en place de la structure initiale du dépôt et de la documentation de base.

### Phase 1 — Mise en place du backend et du frontend

- Initialisation du backend Spring Boot et du frontend Angular.
- Mise en place de la structure de projet.
- Ajout des premiers points d'entrée : health check, Swagger, layout frontend.

### Phase 2 — Authentification et sécurité

- Mise en place du login avec JWT.
- Configuration Spring Security.
- Ajout des guards et de la gestion de session côté frontend.

### Phase 3 — Gestion des utilisateurs et rôles

- Création du module utilisateurs.
- Mise en place des rôles `ADMIN`, `GESTIONNAIRE` et `OBSERVATEUR`.
- Application des permissions côté backend et frontend.

### Phase 4 — Gestion des entrepôts

- Ajout du CRUD des entrepôts.
- Liaison propre entre utilisateurs et entrepôts.
- Mise à jour du schéma SQL et des écrans associés.

### Phase 5 — Gestion des produits

- Ajout du catalogue produits.
- Mise en place du CRUD côté API et interface.
- Restriction des droits d'écriture aux administrateurs.

### Phase 6 — Gestion des stocks et mouvements

- Création des stocks par entrepôt et produit.
- Gestion des entrées et sorties.
- Contrôles métier sur les quantités et les accès.

### Phase 7 — Gestion de la capacité des entrepôts

- Ajout des règles de capacité par entrepôt.
- Vérifications côté backend et côté interface.
- Amélioration de la lisibilité des informations de capacité.

### Phase 8 — Alertes et tableau de bord

- Ajout des alertes de stock faible.
- Mise en place du dashboard avec indicateurs métier.
- Filtrage des données selon le rôle de l'utilisateur.

### Phase 9 — Reprise de l'interface utilisateur

- Nettoyage de l'interface.
- Uniformisation des pages, formulaires et tableaux.
- Suppression des textes provisoires et amélioration du rendu global.

### Phase 10 — Validation métier et données de démonstration

- Vérification des règles métier principales.
- Ajout de données de démonstration plus réalistes.
- Consolidation des cas d'usage pour la démonstration.

### Phase 11 — Tests et nettoyage

- Renforcement des tests backend et frontend.
- Nettoyage du code et des fichiers inutiles.
- Vérification globale avant passage à la partie DevOps.

### Phase 12 — Préparation de l'exécution locale

- Clarification des prérequis.
- Préparation d'un lancement simple en local.
- Stabilisation de la configuration de base.

### Phase 13 — Conteneurisation Docker

- Création des Dockerfiles backend et frontend.
- Mise en place du `docker-compose.yml` principal.
- Intégration de MySQL dans la stack locale.

### Phase 14 — CI de base avec GitHub Actions

- Exécution automatique des tests backend et frontend.
- Build sur les branches de travail principales.
- Première base de validation continue.

### Phase 15 — Qualité logicielle et sécurité pipeline

- Ajout de SonarCloud.
- Ajout des scans CodeQL, OWASP Dependency-Check et Trivy.
- Mise en place d'un niveau de contrôle plus strict avant fusion.

### Phase 16 — Déploiement Kubernetes local

- Création des manifests Kubernetes de base.
- Mise en place de l'overlay local avec kind.
- Déploiement local du backend, frontend et MySQL sur cluster.

### Phase 17 — GitOps et ArgoCD

- Ajout de l'overlay GitOps.
- Création du manifest ArgoCD Application.
- Mise en place d'une source de vérité Git pour le déploiement Kubernetes.

### Phase 18 — CD automatisé avec publication d'images

- Build et publication des images dans GHCR.
- Mise à jour des tags d'images pour le déploiement.
- Automatisation du passage du code validé vers les images livrables.

### Phase 19 — Logging centralisé

- Structuration des logs backend.
- Ajout du `correlationId` pour suivre une requête de bout en bout.
- Préparation des logs pour une exploitation plus simple en Docker et Kubernetes.

### Phase 20 — Observabilité et alerting

- Exposition des métriques Prometheus.
- Ajout de Grafana et des dashboards.
- Définition des premières alertes techniques et métier.

### Phase 21 — Améliorations backend et finition frontend

- Ajout du rate limiting.
- Mise en cache de certaines données côté backend.
- Pagination, corrections d'interface et finitions générales.

### Phase 22 — Gouvernance CI/CD et flux GitOps par PR

- Renforcement des règles autour de `main`.
- Séparation entre validations lourdes et validations légères.
- Passage d'un push GitOps direct à un flux GitOps par pull request.

### Phase 23 — Finalisation et préparation de soutenance

- Relecture et remise au propre de la documentation.
- Vérification des preuves à montrer pendant la démonstration.
- Préparation du support final et des captures utiles.

## Remarques finales

- Le projet est terminé sur le fond fonctionnel et sur la chaîne DevOps principale.
- La dernière phase correspond surtout à la mise en forme finale, à la vérification des preuves et à la préparation de la soutenance.
