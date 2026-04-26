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

Les PR vers `main` exécutent bien la CI. Les PR GitOps bot sont traitées à part pour éviter de relancer les jobs lourds.

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

Dépend de `backend` et `frontend`. Ce job s'exécute uniquement sur `main` ou sur les PR vers `main`.

| Étape        | Action                                                            |
| ------------ | ----------------------------------------------------------------- |
| Checkout     | `fetch-depth: 0` (nécessaire pour l'analyse des nouvelles lignes) |
| Java + Maven | Génère les binaires et le rapport JaCoCo                          |
| Node + npm   | Génère le rapport LCOV                                            |
| Analyse      | `SonarSource/sonarcloud-github-action`                            |

Secret requis : `SONAR_TOKEN`.

## Validation légère sur PR

Le workflow léger `.github/workflows/pr-validation.yml` complète `CI` sur les PR vers `main`.

Il vérifie rapidement :

- la syntaxe YAML des workflows GitHub Actions
- les manifests Kubernetes sous `k8s/`
- les fichiers YAML d'infrastructure sous `infra/`
- `docker-compose.yml`

Le but est de donner un retour rapide sur les workflows et les manifests sans attendre toute la CI applicative.

## Validation des PR GitOps

Le workflow `.github/workflows/gitops-validation.yml` est réservé aux PR GitOps créées par la GitHub App.

La détection repose sur la forme de la PR :

- auteur de type `Bot`
- branche source `gitops/bump-images-*`
- titre `chore(gitops): bump images to sha-*`

Il exécute uniquement des validations légères :

- validation YAML
- `kustomize build k8s/overlays/gitops`
- `kubeconform` sur le rendu GitOps

Il remplace les jobs lourds sur ces PR :

- pas de tests backend
- pas de tests frontend
- pas de build applicatif
- pas de SonarCloud
- pas de scans Security lourds

## Quand la CI est verte

La CI est verte si :

- Tous les tests backend passent
- Tous les tests frontend passent
- Le format est conforme (Prettier)
- Aucune dépendance npm avec vulnérabilité `high` ou `critical`
- Le build backend compile sans erreur
- Le build frontend compile sans erreur
- Le Quality Gate SonarCloud est validé (sur `main` et PRs vers `main`)

## Cache

| Cache           | Clé                                  |
| --------------- | ------------------------------------ |
| Maven (`~/.m2`) | Hash de `backend/pom.xml`            |
| npm (`~/.npm`)  | Hash de `frontend/package-lock.json` |

Les caches accélèrent les exécutions successives. Les réglages GitHub UI associés aux checks requis sont documentés dans [docs/13-manual-work/phase-22-github-governance-setup.md](../13-manual-work/phase-22-github-governance-setup.md).
