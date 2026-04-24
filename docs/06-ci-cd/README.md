# 06 — CI/CD

Cette section couvre les trois workflows GitHub Actions du projet.

| Fichier                                 | Contenu                                                        |
| --------------------------------------- | -------------------------------------------------------------- |
| [ci.md](ci.md)                          | Pipeline CI : tests, build, SonarCloud                         |
| [cd.md](cd.md)                          | Pipeline CD : détection des changements, build GHCR, PR GitOps |
| [pr-validation.md](ci.md#pr-validation) | Validation légère PR : YAML et manifests                       |
| [quality-gates.md](quality-gates.md)    | Quality gates, seuils, scans de sécurité                       |
| [secrets.md](secrets.md)                | Secrets GitHub requis et procédure de configuration            |

## Workflows disponibles

| Fichier                               | Déclencheur                          | Rôle                                                                                   |
| ------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`            | Push / PR sur branches projet        | Tests, build, linting, SonarCloud                                                      |
| `.github/workflows/pr-validation.yml` | PR vers `main`                       | Validation légère YAML / manifests pour required check et auto-merge gouverné          |
| `.github/workflows/cd.yml`            | Push sur `main` avec garde explicite | Publish images GHCR, création d'une PR GitOps uniquement après `CI` + `Security` verts |
| `.github/workflows/security.yml`      | Push / PR + schedule                 | CodeQL, OWASP Dependency-Check, Trivy                                                  |

## Flux global

```
feature/**  → push → CI
                    ↓ PR vers main
                    CI + Security + PR Validation
                    ↓
                    auto-merge GitHub si ruleset OK
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
                    Branche GitOps + PR GitOps
                           ↓
                    auto-merge squash GitHub
                           ↓
                    ArgoCD sync automatique
```

## Cas `main` a connaitre

| Cas                                         | CI                                                           | Security                                                     | CD                                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Push direct administrateur sur `main`       | déclenché sur le commit poussé                               | déclenché sur le commit poussé                               | déclenché sur le même commit mais bloqué tant que `CI` et `Security` ne sont pas tous les deux verts  |
| PR contributeur vers `main`                 | déclenché sur la PR puis à nouveau après le merge sur `main` | déclenché sur la PR puis à nouveau après le merge sur `main` | déclenché seulement après le merge sur `main`, jamais sur la PR                                       |
| PR GitOps `github-actions[bot]` vers `main` | déclenché sur la PR puis sur le commit squash merge final    | déclenché sur la PR puis sur le commit squash merge final    | la PR est créée par `cd.yml`, puis le commit squash final n'est pas republié grâce à `chore(gitops):` |

## Auto-merge contributeur

Pour les PR contributeurs vers `main`, l'auto-merge doit rester pilote par GitHub :

- checks obligatoires du ruleset / branch protection : `CI`, `Security`, `PR Validation`
- revue requise selon la politique du dépôt
- aucune logique de merge automatique n'est implémentée dans les workflows

Le rôle des workflows est uniquement de produire des statuts fiables. La décision de merge automatique reste une responsabilité de configuration GitHub.
