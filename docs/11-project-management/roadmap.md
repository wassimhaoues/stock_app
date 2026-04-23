# Feuille de route — Phases du projet

## Tableau de suivi

| Phase | Nom | Statut | Branche |
|-------|-----|--------|---------|
| 0 | Planification & décisions | ✅ DONE | — |
| 1 | Fondations : backend + frontend | ✅ DONE | `feature/phase-1-foundation` |
| 2 | Authentification & sécurité | ✅ DONE | `feature/phase-2-auth` |
| 3 | Administration utilisateurs & permissions | ✅ DONE | `feature/phase-3-user-management` |
| 4 | Gestion des entrepôts | ✅ DONE | `feature/phase-4-entrepots` |
| 5 | Gestion des produits | ✅ DONE | `feature/phase-5-produits` |
| 6 | Stocks & mouvements | ✅ DONE | `feature/phase-6-stocks` |
| 7 | Gestion de la capacité des entrepôts | ✅ DONE | `feature/phase-7-capacite-entrepots` |
| 8 | Alertes & dashboard analytique | ✅ DONE | `feature/phase-8-analytics-dashboard` |
| 9 | Revue UX/UI frontend | ✅ DONE | `feature/phase-9-frontend-polish` |
| 10 | Validation métier, sécurité & données réalistes | ✅ DONE | `feature/phase-10-business-validation-security` |
| 11 | Tests et nettoyage final | ✅ DONE | `feature/phase-11-tests-cleanup` |
| 12 | Socle d'exécution locale | ✅ DONE | `feature/devops-phase-12-local-baseline` |
| 13 | Conteneurisation complète | ✅ DONE | `feature/devops-phase-13-docker` |
| 14 | CI de base sur GitHub Actions | ✅ DONE | `feature/devops-phase-14-ci-base` |
| 15 | Qualité logicielle et sécurité de pipeline | ✅ DONE | `feature/devops-phase-15-quality-security` |
| 16 | Déploiement Kubernetes local | ✅ DONE | `feature/devops-phase-16-k8s` |
| 17 | GitOps et ArgoCD | ✅ DONE | `feature/devops-phase-17-argocd` |
| 18 | CD automatisé par image versionnée | ✅ DONE | `feature/devops-phase-18-cd-automation` |
| 19 | Observabilité et alerting | ⏳ TODO | `feature/devops-phase-19-observability` |
| 20 | Amélioration continue et finalisation soutenance | ⏳ TODO | `feature/devops-phase-20-finalization` |

## Périmètre par bloc

### Bloc 1 — Application métier (phases 0–11)
Fondations Spring Boot et Angular, authentification JWT, RBAC, gestion des entrepôts/produits/stocks/mouvements, alertes, dashboard analytique, UX/UI, tests.

### Bloc 2 — Infrastructure (phases 12–13)
Configuration locale sans Docker, conteneurisation multi-stage, stack Docker Compose complète.

### Bloc 3 — CI/CD et qualité (phases 14–15)
GitHub Actions CI (tests, build, SonarCloud), security workflow (CodeQL, OWASP, Trivy).

### Bloc 4 — Kubernetes et GitOps (phases 16–18)
Manifests K8s avec Kustomize, ArgoCD, pipeline CD automatisé avec images GHCR et bump GitOps.

### Bloc 5 — Observabilité et finalisation (phases 19–20)
Prometheus, Grafana, alertes, finalisation pour la soutenance.
