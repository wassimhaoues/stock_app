# 06 — CI/CD

Cette section regroupe les workflows GitHub Actions et les points de configuration associés.

| Fichier                                                                                      | Contenu                                                        |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [ci.md](ci.md)                                                                               | CI applicative et validations légères                          |
| [cd.md](cd.md)                                                                               | CD sur `main`, publication GHCR et PR GitOps                   |
| [quality-gates.md](quality-gates.md)                                                         | Seuils de blocage et contrôles qualité                         |
| [secrets.md](secrets.md)                                                                     | Secrets GitHub requis et configuration                         |
| [phase-22-github-governance-setup.md](../13-manual-work/phase-22-github-governance-setup.md) | Réglages GitHub UI manuels                                     |

## Workflows

| Fichier                               | Déclencheur                          | Rôle                                                                                   |
| ------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`            | Push / PR sur branches projet        | Tests backend/frontend, build, SonarCloud                                              |
| `.github/workflows/pr-validation.yml` | PR vers `main`                       | Validation légère YAML et manifests                                                    |
| `.github/workflows/cd.yml`            | Push sur `main` avec garde explicite | Publication GHCR et mise à jour GitOps après validation                                |
| `.github/workflows/security.yml`      | Push / PR + schedule                 | CodeQL, OWASP Dependency-Check, Trivy                                                  |

## Lecture rapide

```
branche de travail
    → CI
    → PR vers main
    → CI + Security + PR Validation
    → merge
    → CD sur main
    → publication GHCR
    → PR GitOps
    → ArgoCD
```

## À retenir

- `main` n'est pas mise à jour directement par le flux GitOps.
- Le CD attend explicitement `CI` et `Security` avant publication.
- Les PR GitOps passent par une validation légère dédiée.

## Réglages manuels

Les réglages GitHub UI qui ne peuvent pas être codés dans le dépôt sont documentés dans [docs/13-manual-work/phase-22-github-governance-setup.md](../13-manual-work/phase-22-github-governance-setup.md).
