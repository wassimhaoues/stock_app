# 06 — CI/CD

Cette section couvre les trois workflows GitHub Actions du projet.

| Fichier | Contenu |
|---------|---------|
| [ci.md](ci.md) | Pipeline CI : tests, build, SonarCloud |
| [cd.md](cd.md) | Pipeline CD : détection des changements, build GHCR, bump GitOps |
| [quality-gates.md](quality-gates.md) | Quality gates, seuils, scans de sécurité |
| [secrets.md](secrets.md) | Secrets GitHub requis et procédure de configuration |

## Workflows disponibles

| Fichier | Déclencheur | Rôle |
|---------|-------------|------|
| `.github/workflows/ci.yml` | Push / PR sur toutes les branches | Tests, build, linting, SonarCloud |
| `.github/workflows/cd.yml` | CI verte sur `main` | Publish images GHCR, mise à jour GitOps |
| `.github/workflows/security.yml` | Push / PR + schedule | CodeQL, OWASP Dependency-Check, Trivy |

## Flux global

```
feature/**  → push → CI (tests + qualité)
                    ↓ PR vers main
main        → merge → CI verte
                          ↓
                      CD déclenché
                          ↓
                    Détection des changements
                    (backend? / frontend?)
                          ↓
                    Build + push GHCR
                          ↓
                    Bump kustomization.yaml
                          ↓
                    Commit sur main [skip ci]
                          ↓
                    ArgoCD sync automatique
```
