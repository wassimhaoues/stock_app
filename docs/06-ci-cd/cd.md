# Pipeline CD

Fichier : `.github/workflows/cd.yml`

## Déclencheur

```yaml
on:
  push:
    branches: [main]
```

Le CD se déclenche sur chaque push vers `main`, mais il n'a pas le droit de publier immédiatement.
Le premier job attend explicitement les workflows `CI` et `Security` sur le même SHA avant de laisser démarrer les builds et la mise à jour GitOps.
Il ne se déclenche jamais sur les branches de fonctionnalité.

## Garde de gouvernance sur `main`

Le job `wait-for-main-validations` interroge l'API GitHub Actions jusqu'à trouver les runs `CI` et `Security` du commit courant sur `main`.

Règles :

- si l'un des deux workflows est absent ou encore en cours, CD attend
- si l'un des deux workflows échoue, CD échoue sans publier d'image ni modifier GitOps
- si les deux workflows sont `success`, CD continue

Conséquence importante :

- un administrateur peut pousser directement sur `main`
- ce push déclenche bien `CI`, `Security` et `CD`
- mais `CD` ne publie rien tant que `CI` et `Security` ne sont pas verts

## Protection anti-boucle

Le job `wait-for-main-validations` ne démarre pas pour un commit `main` dont le message commence par `chore(gitops):`.

Le flux 22.3 repose sur une PR GitOps mergee en **squash** :

- le commit final sur `main` reprend donc le titre `chore(gitops): bump images to sha-xxxxxxx`
- ce push ne relance pas une nouvelle publication CD
- ArgoCD ne synchronise qu'apres le merge de la PR GitOps

Cette strategie garde une protection significative :

- aucune ecriture GitOps directe sur `main`
- merge par PR comme chemin nominal
- auto-merge GitHub seulement apres checks requis

## Jobs

### wait-for-main-validations

Bloque tout le workflow tant que `CI` et `Security` ne sont pas terminés avec succès pour le commit `main` en cours.

### detect-changes

Analyse le diff entre `HEAD~1` et `HEAD` pour déterminer quelles parties du code ont changé.

**Outputs :**

- `backend` : `true` si des fichiers dans `backend/` ont changé
- `frontend` : `true` si des fichiers dans `frontend/` ont changé
- `tag` : `sha-<7 premiers caractères du SHA>`

```bash
# Exemple de logique de détection
CHANGED=$(git diff --name-only HEAD~1 HEAD)
if echo "${CHANGED}" | grep -q "^backend/"; then backend=true; fi
if echo "${CHANGED}" | grep -q "^frontend/"; then frontend=true; fi
```

Requiert `fetch-depth: 2` pour accéder au commit parent.

### build-backend

S'exécute uniquement si `detect-changes.outputs.backend == 'true'`.

| Étape        | Action                                       |
| ------------ | -------------------------------------------- |
| Checkout     | SHA du commit qui a déclenché la CI          |
| Login GHCR   | `docker/login-action@v3` avec `GITHUB_TOKEN` |
| Buildx       | `docker/setup-buildx-action@v3`              |
| Build + push | `docker/build-push-action@v6`, cache GHA     |

Image publiée : `ghcr.io/wassimhaoues/stockpro-backend:sha-XXXXXXX`

Permission requise : `packages: write`

### build-frontend

Identique à `build-backend` mais pour le frontend.

Image publiée : `ghcr.io/wassimhaoues/stockpro-frontend:sha-XXXXXXX`

### gitops-bump

S'exécute si au moins un build a réussi :

```yaml
if: >-
  always() &&
  (needs.build-backend.result == 'success' ||
   needs.build-frontend.result == 'success')
```

L'utilisation de `always()` est nécessaire car un job "skipped" (build non déclenché) propaguerait sinon "skipped" à tous les jobs dépendants.

**Étapes :**

1. Checkout avec `fetch-depth: 0`
2. Installer `kustomize v5.4.3`
3. Mettre à jour `k8s/overlays/gitops/kustomization.yaml`
4. Créer une branche GitOps dédiée, par exemple `gitops/bump-images-sha-xxxxxxx`
5. Committer le changement avec le titre `chore(gitops): bump images to sha-xxxxxxx`
6. Pousser cette branche avec `GITHUB_TOKEN`
7. Ouvrir ou mettre à jour une PR vers `main`
8. Activer l'auto-merge GitHub en `squash`

```bash
git fetch origin main
git checkout main
git pull --rebase origin main
git switch -C gitops/bump-images-sha-xxxxxxx

cd k8s/overlays/gitops
# Met a jour uniquement les images qui ont ete buildées
kustomize edit set image \
  "stockpro-backend=ghcr.io/wassimhaoues/stockpro-backend:sha-XXXXXXX"

git commit -m "chore(gitops): bump images to sha-XXXXXXX"
git push origin gitops/bump-images-sha-XXXXXXX
gh pr create --base main --head gitops/bump-images-sha-XXXXXXX ...
gh pr merge --auto --squash --delete-branch <numero-ou-url-pr>
```

## Stratégie de tags d'image

Les images sont taguées uniquement avec le SHA court du commit (`sha-XXXXXXX`).

| Avantage          | Détail                                                      |
| ----------------- | ----------------------------------------------------------- |
| Immuable          | Chaque tag correspond à exactement un commit                |
| Traçable          | Le tag identifie immédiatement la source dans Git           |
| Compatible ArgoCD | ArgoCD détecte le changement de tag dans kustomization.yaml |

Le tag `latest` n'est pas utilisé (muable, sans traçabilité, inutile avec ArgoCD).

## Builds sélectifs

Seules les images correspondant aux changements de code sont buildées. Si seul `backend/` a changé :

- `build-backend` s'exécute
- `build-frontend` est skippé
- `gitops-bump` met à jour uniquement le tag backend dans `kustomization.yaml`

Cela réduit le temps d'exécution et évite de publier une image identique avec un nouveau tag.

## Authentification GHCR vs GitHub API

| Opération                  | Mécanisme                                          |
| -------------------------- | -------------------------------------------------- |
| Push images vers GHCR      | `GITHUB_TOKEN` (permission `packages: write`)      |
| Push branche GitOps        | `GITHUB_TOKEN` (permission `contents: write`)      |
| Créer / gérer la PR GitOps | `GITHUB_TOKEN` (permission `pull-requests: write`) |
| Auto-merge de la PR GitOps | GitHub auto-merge + ruleset / branch protection    |

La branche `main` n'est plus ecrite directement par le workflow CD. Le pipeline ne depend donc plus d'une deploy key SSH pour contourner la protection de branche.

## Différence entre les trois flux `main`

### Push direct administrateur sur `main`

- `CI`, `Security` et `CD` démarrent sur le même commit
- `CD` attend que `CI` et `Security` soient verts
- si un workflow échoue, aucune image n'est publiée

### PR contributeur vers `main`

- la PR exécute `CI` et `Security` pour valider le changement avant merge
- la PR doit aussi satisfaire les checks légers définis pour les PR contributeurs
- après merge, le commit arrive sur `main`
- ce push sur `main` relance `CI`, `Security` puis `CD` attend leurs résultats avant de publier

### PR GitOps `github-actions[bot]`

- `CD` cree une branche GitOps puis une PR vers `main`
- cette PR peut etre auto-mergee par GitHub uniquement apres les checks legers GitOps requis
- le merge en squash cree un commit `chore(gitops): ...` sur `main`
- ce commit ne republie pas les images et evite une boucle CD

## Auto-merge et ruleset

Le depot doit etre configure pour que :

- les PR contributeurs ne deviennent auto-mergeables qu'apres `CI`, `Security` et `PR Validation`
- les PR GitOps bot ne deviennent auto-mergeables qu'apres `GitOps Validation`

Les workflows n'essaient jamais de contourner ces regles. Ils produisent des statuts et demandent l'auto-merge, mais GitHub reste l'autorite finale de fusion.
