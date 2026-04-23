# Pipeline CD

Fichier : `.github/workflows/cd.yml`

## Déclencheur

```yaml
on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches: [main]
```

Le CD se déclenche uniquement quand la CI se termine avec succès sur `main`. Il ne se déclenche jamais sur les branches de fonctionnalité.

## Protection anti-boucle

Le job `detect-changes` vérifie que le message du commit ne commence pas par `chore(gitops):`. Cela empêche le commit GitOps d'être repris par le CD.

De plus, le commit GitOps contient `[skip ci]` dans son message, ce qui empêche GitHub de déclencher la CI sur ce commit.

## Jobs

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

| Étape | Action |
|-------|--------|
| Checkout | SHA du commit qui a déclenché la CI |
| Login GHCR | `docker/login-action@v3` avec `GITHUB_TOKEN` |
| Buildx | `docker/setup-buildx-action@v3` |
| Build + push | `docker/build-push-action@v6`, cache GHA |

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

1. Checkout avec `fetch-depth: 0` (nécessaire pour le push)
2. Configurer l'agent SSH avec le secret `SSH_PRIVATE_KEY`
3. Installer `kustomize v5.4.3`
4. Mettre à jour `k8s/overlays/gitops/kustomization.yaml` :

```bash
git remote set-url origin git@github.com:${{ github.repository }}.git
git fetch origin main
git checkout main
git pull --rebase origin main

cd k8s/overlays/gitops
# Met à jour uniquement les images qui ont été buildées
kustomize edit set image \
  "stockpro-backend=ghcr.io/wassimhaoues/stockpro-backend:sha-XXXXXXX"
```

5. Créer et pousser le commit GitOps :

```bash
git commit -m "chore(gitops): bump images to sha-XXXXXXX [skip ci]"
git push origin main
```

## Stratégie de tags d'image

Les images sont taguées uniquement avec le SHA court du commit (`sha-XXXXXXX`).

| Avantage | Détail |
|----------|--------|
| Immuable | Chaque tag correspond à exactement un commit |
| Traçable | Le tag identifie immédiatement la source dans Git |
| Compatible ArgoCD | ArgoCD détecte le changement de tag dans kustomization.yaml |

Le tag `latest` n'est pas utilisé (muable, sans traçabilité, inutile avec ArgoCD).

## Builds sélectifs

Seules les images correspondant aux changements de code sont buildées. Si seul `backend/` a changé :
- `build-backend` s'exécute
- `build-frontend` est skippé
- `gitops-bump` met à jour uniquement le tag backend dans `kustomization.yaml`

Cela réduit le temps d'exécution et évite de publier une image identique avec un nouveau tag.

## Authentification GHCR vs SSH

| Opération | Mécanisme |
|-----------|-----------|
| Push images vers GHCR | `GITHUB_TOKEN` (permission `packages: write`) |
| Push commit GitOps vers `main` | SSH deploy key (secret `SSH_PRIVATE_KEY`) |

La deploy key SSH est nécessaire car la branche `main` est protégée. La règle "allow deploy keys" dans les branch rulesets permet à la clé SSH de bypasser la protection.
