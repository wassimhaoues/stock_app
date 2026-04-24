# 06 — CI/CD

Cette section couvre les trois workflows GitHub Actions du projet.

| Fichier                              | Contenu                                                          |
| ------------------------------------ | ---------------------------------------------------------------- |
| [ci.md](ci.md)                       | Pipeline CI : tests, build, SonarCloud                           |
| [cd.md](cd.md)                       | Pipeline CD : détection des changements, build GHCR, bump GitOps |
| [quality-gates.md](quality-gates.md) | Quality gates, seuils, scans de sécurité                         |
| [secrets.md](secrets.md)             | Secrets GitHub requis et procédure de configuration              |

## Workflows disponibles

| Fichier                          | Déclencheur                          | Rôle                                                                             |
| -------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`       | Push / PR sur branches projet        | Tests, build, linting, SonarCloud                                                |
| `.github/workflows/cd.yml`       | Push sur `main` avec garde explicite | Publish images GHCR, mise à jour GitOps uniquement après `CI` + `Security` verts |
| `.github/workflows/security.yml` | Push / PR + schedule                 | CodeQL, OWASP Dependency-Check, Trivy                                            |

## Flux global

```
feature/**  → push → CI
                    ↓ PR vers main
                    CI + Security sur la PR
                    ↓ merge
main        → push → CI + Security + CD
                           ↓
                    CD attend explicitement CI + Security
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

## Cas `main` a connaitre

| Cas                                            | CI                                                           | Security                                                     | CD                                                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Push direct administrateur sur `main`          | déclenché sur le commit poussé                               | déclenché sur le commit poussé                               | déclenché sur le même commit mais bloqué tant que `CI` et `Security` ne sont pas tous les deux verts |
| PR contributeur vers `main`                    | déclenché sur la PR puis à nouveau après le merge sur `main` | déclenché sur la PR puis à nouveau après le merge sur `main` | déclenché seulement après le merge sur `main`, jamais sur la PR                                      |
| Commit GitOps `github-actions[bot]` sur `main` | ignoré via `[skip ci]`                                       | ignoré via `[skip ci]`                                       | ignoré via `[skip ci]` et garde `chore(gitops):` pour éviter la boucle                               |
