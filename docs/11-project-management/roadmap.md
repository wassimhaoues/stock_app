# Feuille de route — Phases du projet

## Tableau de suivi

| Phase | Nom                                           | Statut  | Branche                                                 |
| ----- | --------------------------------------------- | ------- | ------------------------------------------------------- |
| 0     | Planification et cadrage                      | Terminé | —                                                       |
| 1     | Fondations backend et frontend                | Terminé | `feature/phase-1-foundation`                            |
| 2     | Authentification et sécurité                  | Terminé | `feature/phase-2-auth`                                  |
| 3     | Gestion des utilisateurs et rôles             | Terminé | `feature/phase-3-user-management`                       |
| 4     | Gestion des entrepôts                         | Terminé | `feature/phase-4-entrepots`                             |
| 5     | Gestion des produits                          | Terminé | `feature/phase-5-produits`                              |
| 6     | Gestion des stocks et mouvements              | Terminé | `feature/phase-6-stocks`                                |
| 7     | Gestion de la capacité des entrepôts          | Terminé | `feature/phase-7-capacite-entrepots`                    |
| 8     | Alertes et tableau de bord                    | Terminé | `feature/phase-8-analytics-dashboard`                   |
| 9     | Reprise de l'interface utilisateur            | Terminé | `feature/phase-9-frontend-polish`                       |
| 10    | Validation métier et données de démonstration | Terminé | `feature/phase-10-business-validation-security`         |
| 11    | Tests et nettoyage                            | Terminé | `feature/phase-11-tests-cleanup`                        |
| 12    | Préparation de l'exécution locale             | Terminé | `feature/devops-phase-12-local-baseline`                |
| 13    | Conteneurisation Docker                       | Terminé | `feature/devops-phase-13-docker`                        |
| 14    | CI de base avec GitHub Actions                | Terminé | `feature/devops-phase-14-ci-base`                       |
| 15    | Qualité logicielle et sécurité pipeline       | Terminé | `feature/devops-phase-15-quality-security`              |
| 16    | Déploiement Kubernetes local                  | Terminé | `feature/devops-phase-16-k8s`                           |
| 17    | GitOps et ArgoCD                              | Terminé | `feature/devops-phase-17-argocd`                        |
| 18    | CD automatisé avec publication d'images       | Terminé | `feature/devops-phase-18-cd-automation`                 |
| 19    | Logging centralisé                            | Terminé | `feature/devops-phase-19-centralized-logging`           |
| 20    | Observabilité et alerting                     | Terminé | `feature/devops-phase-20-observability`                 |
| 21    | Améliorations backend et finition frontend    | Terminé | `feature/phase-21-backend-enhancements-frontend-polish` |
| 22    | Gouvernance CI/CD et flux GitOps par PR       | Terminé | `feature/devops-phase-22-github-governance`             |
| 23    | Finalisation et préparation de soutenance     | Terminé | `feature/devops-phase-23-finalization`                  |

## Périmètre par bloc

### Bloc 1 — Application métier (phases 0–11)

Fondations Spring Boot et Angular, authentification JWT, gestion des rôles, modules métier, interface, validation métier et tests.

### Bloc 2 — Infrastructure (phases 12–13)

Préparation du poste local, conteneurisation multi-stage et stack Docker Compose complète.

### Bloc 3 — CI/CD et qualité (phases 14–15)

GitHub Actions pour la CI, qualité logicielle et scans de sécurité.

### Bloc 4 — Kubernetes et GitOps (phases 16–18)

Déploiement local sur Kubernetes, mise en place d'ArgoCD et automatisation de la publication des images.

### Bloc 5 — Exploitation et finition (phases 19–23)

Logging, observabilité, durcissement CI/CD et préparation de la soutenance.
