# Phase 18 — CD automatisé par image versionnée

## Objectif

Supprimer les actions manuelles après un changement de code en automatisant la chaîne :

```
code fusionné dans main
  → CI verte (tests + SonarCloud)
  → détection des dossiers modifiés (backend/ et/ou frontend/)
  → builds sélectifs : seules les images dont le code a changé sont reconstruites
  → images publiées sur GHCR avec le tag sha-<7 chars>
  → tag d'image mis à jour dans Git (uniquement pour les images reconstruites)
  → ArgoCD synchronise le cluster
  → pods recréés avec la nouvelle image
```

---

## Graphe des jobs du workflow CD

```
detect-changes          ← point d'entrée : calcule le tag, détecte backend/ et frontend/
    ├── build-backend   ← s'exécute UNIQUEMENT si backend/ a changé
    └── build-frontend  ← s'exécute UNIQUEMENT si frontend/ a changé
              └── gitops-bump  ← s'exécute si au moins un build a réussi
```

Avantage des builds sélectifs :
- Un commit qui ne touche que le backend ne reconstruit pas l'image frontend.
- Les deux builds peuvent se lancer en parallèle si les deux dossiers ont changé.
- Le tag frontend dans `kustomization.yaml` n'est pas touché si frontend n'a pas été reconstruit (il garde la valeur du dernier build frontend réussi).

---

## Fichiers créés ou modifiés dans cette phase

| Fichier | Action | Rôle |
|---|---|---|
| `.github/workflows/cd.yml` | Créé | Workflow CD avec builds sélectifs |
| `k8s/overlays/gitops/kustomization.yaml` | Modifié | Référence GHCR + tag géré par CD |
| `docs/phase-18-cd-automation.md` | Créé | Ce guide |

---

## Prérequis GitHub (à vérifier une seule fois)

### 1. Visibilité des packages GHCR

Les images construites par le workflow sont publiées sous `ghcr.io/<owner>/stockpro-backend` et `ghcr.io/<owner>/stockpro-frontend`.

Après le premier push d'une image, vérifiez la visibilité dans GitHub :

1. Aller sur `github.com/<owner>` → onglet **Packages**.
2. Cliquer sur le package (`stockpro-backend` ou `stockpro-frontend`).
3. **Package settings** → **Change visibility** → choisir **Public**.

Un cluster Kubernetes (kind ou autre) peut ainsi tirer l'image sans imagePullSecret.

> Si vous gardez les packages en **Private**, ajoutez un imagePullSecret dans le namespace `stockpro` :
>
> ```bash
> kubectl create secret docker-registry ghcr-pull-secret \
>   --docker-server=ghcr.io \
>   --docker-username=<votre-github-username> \
>   --docker-password=<votre-PAT-read:packages> \
>   -n stockpro
> ```
>
> Puis référencez ce secret dans les Deployments ou dans le ServiceAccount.

### 2. Permissions GitHub Actions — push vers main

Le workflow CD pousse un commit GitOps dans `main` via `github-actions[bot]`.

Si la branche `main` a une règle de protection (branch protection), le bot doit être autorisé à la contourner :

1. Dépôt GitHub → **Settings** → **Branches** → règle sur `main`.
2. **Allow specified actors to bypass required pull requests** → ajouter `github-actions[bot]`.

> **Alternativement**, si vous préférez ne pas modifier la protection de branche, créez un Personal Access Token (PAT) avec la portée `repo` et stockez-le comme secret GitHub nommé `GH_PAT`. Remplacez ensuite `secrets.GITHUB_TOKEN` par `secrets.GH_PAT` dans l'étape "Checkout" et l'étape "Mettre à jour kustomization.yaml" du fichier `cd.yml`.

### 3. Permissions du workflow dans les paramètres dépôt

1. Dépôt GitHub → **Settings** → **Actions** → **General**.
2. **Workflow permissions** → sélectionner **Read and write permissions**.
3. Cocher **Allow GitHub Actions to create and approve pull requests** (optionnel mais pratique).

---

## Description du flux étape par étape

### Étape 1 — Fusion sur main

Un développeur ouvre une Pull Request depuis une branche `feature/...` vers `main`. Après revue et validation des status checks (CI verte), la PR est fusionnée.

### Étape 2 — CI s'exécute (ci.yml)

Le workflow `CI` se déclenche automatiquement :

- **Job `backend`** : `mvn verify` (tests unitaires + intégration + coverage)
- **Job `frontend`** : lint, tests Vitest, audit npm, build Angular
- **Job `sonarcloud`** : analyse de qualité, Quality Gate bloquant

Si un job échoue, le workflow CI est marqué **failed**. Le workflow CD ne démarrera pas.

### Étape 3 — Job `detect-changes` : détection des fichiers modifiés

Le déclencheur `workflow_run` surveille la fin du workflow "CI" sur `main`. Quand CI réussit, le job `detect-changes` démarre.

**Condition anti-boucle** : si le commit déclencheur commence par `chore(gitops):`, le job est ignoré et aucun build ne se lance. Cela empêche le cycle infini.

Le job effectue un `git diff HEAD~1 HEAD --name-only` pour lister les fichiers modifiés dans le commit, puis analyse les chemins :

```bash
# Exemple — commit qui modifie uniquement le backend :
backend/src/main/java/.../StockService.java   ← détecté : backend=true
                                               # frontend=false → build frontend ignoré

# Exemple — commit qui modifie les deux :
backend/pom.xml                               ← backend=true
frontend/src/app/stocks/stocks.component.ts   ← frontend=true
```

Le tag d'image est aussi calculé ici et partagé avec les jobs suivants :

```
commit SHA : a1b2c3d4e5f67890...
tag calculé : sha-a1b2c3d
```

### Étape 4 — Jobs `build-backend` et `build-frontend` (parallèles si nécessaire)

Chaque job lit l'output de `detect-changes` et ne s'exécute que si son dossier a changé.

| Scénario | build-backend | build-frontend |
|---|---|---|
| Seul backend/ modifié | exécuté | ignoré (skipped) |
| Seul frontend/ modifié | ignoré (skipped) | exécuté |
| Les deux modifiés | exécuté en parallèle | exécuté en parallèle |
| Aucun des deux | ignoré | ignoré |

Les images reconstruites sont publiées sur GHCR avec deux tags :

```
ghcr.io/<owner>/stockpro-backend:sha-a1b2c3d   ← tag précis utilisé par ArgoCD
ghcr.io/<owner>/stockpro-backend:latest         ← commodité, non utilisé par ArgoCD
```

Le cache de couches Docker (GitHub Actions Cache) évite de reconstruire les dépendances Maven et npm si elles n'ont pas changé entre deux commits.

### Étape 5 — Job `gitops-bump` : mise à jour sélective du tag

Ce job ne s'exécute que si au moins un des deux builds a réussi. Il installe `kustomize` et met à jour **uniquement les images effectivement reconstruites** dans `k8s/overlays/gitops/kustomization.yaml` :

```bash
# Si build-backend a réussi :
kustomize edit set image \
  "stockpro-backend=ghcr.io/<owner>/stockpro-backend:sha-a1b2c3d"

# Si build-frontend a réussi :
kustomize edit set image \
  "stockpro-frontend=ghcr.io/<owner>/stockpro-frontend:sha-a1b2c3d"
```

Résultat dans le fichier (ici seul le backend a changé) :

```yaml
images:
  - name: stockpro-backend
    newName: ghcr.io/wassimhaoues/stockpro-backend
    newTag: sha-a1b2c3d    # ← mis à jour
  - name: stockpro-frontend
    newName: ghcr.io/wassimhaoues/stockpro-frontend
    newTag: sha-0ab1c2d    # ← inchangé : dernier build frontend réussi
```

### Étape 6 — Commit GitOps

Le job pousse le fichier modifié dans `main` :

```
chore(gitops): bump images to sha-a1b2c3d [skip ci]
```

- `[skip ci]` empêche GitHub Actions de relancer CI sur ce commit technique.
- `chore(gitops):` préfixe reconnu par la condition anti-boucle du job `detect-changes`.

### Étape 7 — ArgoCD détecte le changement et synchronise

ArgoCD surveille la branche `main` en mode **auto-sync** (`selfHeal: true`). Dès que le commit GitOps est poussé, ArgoCD :

1. Clone le dépôt.
2. Génère les manifests via `kustomize build k8s/overlays/gitops`.
3. Compare l'état désiré avec l'état réel du cluster.
4. Applique les différences : seuls les Deployments dont le tag a changé sont mis à jour.

### Étape 8 — Pods recréés

Kubernetes crée de nouveaux pods avec l'image versionnée depuis GHCR et termine les anciens une fois les nouveaux prêts (rolling update stratégie par défaut).

---

## Points de vérification

### Vérifier que les images sont dans GHCR

```bash
# Dans un navigateur :
# https://github.com/<owner>?tab=packages
# Ou avec la CLI gh :
gh api user/packages/container/stockpro-backend/versions --jq '.[0:3]'
```

### Vérifier que le commit GitOps est dans main

```bash
git log --oneline -5 origin/main
# Résultat attendu :
# abc1234 chore(gitops): bump images to sha-a1b2c3d [skip ci]
# def5678 feat: votre commit applicatif
```

### Vérifier le contenu du kustomization.yaml mis à jour

```bash
grep -A2 "stockpro-backend" k8s/overlays/gitops/kustomization.yaml
# Résultat attendu :
# newName: ghcr.io/wassimhaoues/stockpro-backend
# newTag: sha-a1b2c3d
```

### Vérifier la synchronisation ArgoCD (UI)

1. Ouvrir l'interface ArgoCD :

   ```bash
   kubectl port-forward svc/argocd-server -n argocd 8080:443
   # Navigateur : https://localhost:8080
   ```

2. L'application `stockpro` doit afficher :
   - **Status** : `Synced`
   - **Health** : `Healthy`
   - La révision active doit correspondre au commit GitOps

### Vérifier l'image dans le pod

```bash
kubectl get pods -n stockpro
kubectl describe pod <nom-du-pod-backend> -n stockpro | grep "Image:"
# Résultat attendu :
# Image: ghcr.io/wassimhaoues/stockpro-backend:sha-a1b2c3d
```

---

## Ce qui reste manuel pendant l'apprentissage local

| Action | Manuel ou automatisé |
|---|---|
| Lancer le cluster kind | Manuel (phase 16/17) |
| Créer le secret `stockpro-secrets` | Manuel une seule fois |
| Installer ArgoCD dans le cluster | Manuel une seule fois |
| Appliquer `k8s/argocd/stockpro-app.yaml` | Manuel une seule fois |
| Build et push des images après merge sur main | **Automatisé par cd.yml** |
| Mise à jour du tag dans kustomization.yaml | **Automatisé par cd.yml** |
| Synchronisation ArgoCD | **Automatisé par l'auto-sync** |
| Recréation des pods | **Automatisé par Kubernetes** |

---

## Différence entre l'overlay local (phase 16/17) et l'overlay gitops (phase 18)

| Critère | `k8s/overlays/local` | `k8s/overlays/gitops` |
|---|---|---|
| Images | `stockpro-backend:local` chargées dans kind | `ghcr.io/<owner>/stockpro-backend:sha-XXXXXXX` depuis GHCR |
| Mise à jour du tag | Manuelle (`kind load docker-image`) | Automatique via `cd.yml` |
| secretGenerator | Oui (depuis `.env`) | Non (secret créé manuellement) |
| Utilisé par | Apprentissage local | Flux GitOps automatisé |

Les deux overlays coexistent. L'overlay local n'est pas modifié par cette phase.

---

## Résolution de problèmes courants

### Le workflow CD ne démarre pas

- Vérifier que le workflow CI s'est bien terminé avec `success` (pas `skipped` ni `failure`).
- Vérifier que le commit fusionné ne contient pas `[skip ci]` dans son message.
- Vérifier que la branche est bien `main` (pas `dev` ni `feature/...`).

### Le push du commit GitOps échoue (403 Forbidden)

La protection de branche bloque le push du bot. Solutions :
1. Ajouter `github-actions[bot]` comme acteur autorisé à bypasser la protection.
2. OU utiliser un PAT (`secrets.GH_PAT`) avec la portée `repo`.

Voir la section **Prérequis GitHub** ci-dessus.

### Le pod ne démarre pas (ImagePullBackOff)

Le cluster ne peut pas tirer l'image depuis GHCR.
- Vérifier que le package est **Public** dans les paramètres GitHub.
- OU créer un `imagePullSecret` dans le namespace `stockpro`.
- Vérifier que le cluster a accès à internet (pour kind : les conteneurs doivent pouvoir joindre `ghcr.io`).

### ArgoCD ne synchronise pas automatiquement

- Vérifier que `automated.selfHeal: true` est activé dans `k8s/argocd/stockpro-app.yaml`.
- Forcer une synchronisation manuelle depuis l'UI ArgoCD ou via CLI :

  ```bash
  argocd app sync stockpro
  ```

### Le tag ne change pas dans kustomization.yaml

Le job CD inclut une vérification `git diff --cached --quiet` qui ignore le commit si le tag n'a pas changé (même SHA relancé manuellement). C'est le comportement attendu.
