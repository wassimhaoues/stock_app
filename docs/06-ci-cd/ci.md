# Pipeline CI

Fichier : `.github/workflows/ci.yml`

## Déclencheurs

```yaml
on:
  push:
    branches: [main, dev, "feature/**"]
  pull_request:
    branches: [main, dev]
```

Pour la phase 22.2, les PR vers `main` continuent donc bien à exécuter `CI`.
En phase 22.4, les PR GitOps créées par `github-actions[bot]` sont explicitement exclues de ce workflow lourd.

## Rôle sur `main`

Sur `main`, `CI` fait partie des validations obligatoires du flux de livraison.
Le workflow `cd.yml` peut démarrer sur le push vers `main`, mais il attend explicitement la conclusion `success` de `CI` avant de publier des images GHCR ou de modifier GitOps.

## Jobs

### backend

| Étape         | Action                                                                         |
| ------------- | ------------------------------------------------------------------------------ |
| Checkout      | `actions/checkout@v4`                                                          |
| Java 17       | `actions/setup-java@v4` avec cache Maven                                       |
| Tests + build | `./mvnw --batch-mode verify` (tests unitaires, intégration, couverture JaCoCo) |

Variables d'environnement injectées pendant les tests :

- `JWT_SECRET` (depuis GitHub Secrets)
- `DB_*` variables pointant vers une base de test H2 en mémoire

### frontend

| Étape              | Action                                 |
| ------------------ | -------------------------------------- |
| Checkout           | `actions/checkout@v4`                  |
| Node.js 20         | `actions/setup-node@v4` avec cache npm |
| Installation       | `npm ci`                               |
| Formatage          | `npm run format:check`                 |
| Tests + couverture | `npm run test:coverage`                |
| Audit dépendances  | `npm audit --audit-level=high`         |
| Build              | `npm run build`                        |

### sonarcloud

Dépend de `backend` et `frontend`. S'exécute uniquement sur `main` ou les PRs vers `main`.

| Étape        | Action                                                            |
| ------------ | ----------------------------------------------------------------- |
| Checkout     | `fetch-depth: 0` (nécessaire pour l'analyse des nouvelles lignes) |
| Java + Maven | Génère les binaires et le rapport JaCoCo                          |
| Node + npm   | Génère le rapport LCOV                                            |
| Analyse      | `SonarSource/sonarcloud-github-action`                            |

Requiert le secret `SONAR_TOKEN`.

## PR Validation

Le workflow léger `.github/workflows/pr-validation.yml` complète `CI` sur les PR vers `main`.

Il vérifie rapidement :

- la syntaxe YAML des workflows GitHub Actions
- les manifests Kubernetes sous `k8s/`
- les fichiers YAML d'infrastructure sous `infra/`
- `docker-compose.yml`

Ce check reste volontairement indépendant du build applicatif pour fournir un signal rapide avant merge ou auto-merge.

## GitOps Validation

Le workflow `.github/workflows/gitops-validation.yml` est réservé aux PR GitOps créées par `github-actions[bot]` avec une branche `gitops/bump-images-*`.

Il exécute uniquement des validations légères :

- validation YAML
- `kustomize build k8s/overlays/gitops`
- `kubectl apply --dry-run=client` sur le rendu GitOps

Il remplace les jobs lourds sur ces PR :

- pas de tests backend
- pas de tests frontend
- pas de build applicatif
- pas de SonarCloud
- pas de scans Security lourds

## Conditions de succès

La CI est verte si :

- Tous les tests backend passent
- Tous les tests frontend passent
- Le format est conforme (Prettier)
- Aucune dépendance npm avec vulnérabilité `high` ou `critical`
- Le build backend compile sans erreur
- Le build frontend compile sans erreur
- Le Quality Gate SonarCloud est validé (sur `main` et PRs vers `main`)

## Caches

| Cache           | Clé                                  |
| --------------- | ------------------------------------ |
| Maven (`~/.m2`) | Hash de `backend/pom.xml`            |
| npm (`~/.npm`)  | Hash de `frontend/package-lock.json` |

Les caches accélèrent considérablement les exécutions successives.

## Branche protégée

La branche `main` est protégée. Une fusion nécessite :

- La CI verte (`backend`, `frontend`, `sonarcloud`)
- Au moins une revue de code (selon configuration GitHub)

En phase 22.1, cette protection doit rester cohérente avec les checks GitHub obligatoires configurés sur `main`.

En phase 22.2, pour une PR contributeur vers `main`, les checks obligatoires attendus doivent inclure au minimum :

- `CI`
- `Security`
- `PR Validation`

L'auto-merge GitHub peut alors être activé pour les contributeurs autorisés, sans contourner la protection de branche.

Pour une PR GitOps bot vers `main`, le dépôt est maintenant préparé pour un autre jeu de checks :

- `GitOps Validation`

Les checks lourds `CI` et `Security` sont volontairement ignorés sur ce type de PR.
