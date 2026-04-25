# Phase 22 — Travaux manuels GitHub : gouvernance CI/CD et GitOps

Ce guide couvre les actions **GitHub UI** qui restent manuelles après l'implémentation de toute la phase 22.

Le dépôt contient déjà :

- le gating de `cd.yml` sur `CI` + `Security` pour les pushes sur `main`
- les checks lourds pour les PR contributeurs
- les checks légers dédiés aux PR GitOps bot
- la création d'une PR GitOps via une GitHub App
- la demande d'auto-merge GitHub sur la PR GitOps

Il te reste à aligner les réglages GitHub avec ce comportement.

---

## Résultat cible

À la fin de cette configuration :

- une PR contributeur vers `main` exécute les checks lourds attendus
- une PR contributeur autorisée peut être auto-mergée après réussite des checks requis
- un push direct administrateur sur `main` reste possible, mais le déploiement reste bloqué tant que `CI` et `Security` ne sont pas verts
- `cd.yml` ne pousse jamais GitOps directement sur `main`
- `cd.yml` crée une PR GitOps `chore(gitops): bump images to sha-xxxxxxx`
- la PR GitOps n'exécute que `GitOps Validation`
- la PR GitOps peut être auto-mergée si ta configuration GitHub permet de distinguer ses checks requis
- ArgoCD ne synchronise qu'après merge dans `main`

---

## Étape 1 — Vérifier GitHub Actions

Dans **Settings → Actions → General** :

1. Vérifier que GitHub Actions est autorisé sur le dépôt.
2. Dans **Workflow permissions**, sélectionner **Read and write permissions**.
3. Activer **Allow GitHub Actions to create and approve pull requests**.

**Pourquoi :**

- `cd.yml` pousse une branche GitOps
- `cd.yml` ouvre une PR GitOps
- `cd.yml` demande l'auto-merge GitHub

Sans ces options, le workflow pourra publier les images GHCR mais échouera au moment de créer ou gérer la PR GitOps.

### Secrets requis

Dans **Settings → Secrets and variables → Actions → Repository secrets**, vérifier :

- `GH_APP_ID`
- `GH_APP_PRIVATE_KEY`

Ces deux secrets sont ceux utilisés par `cd.yml` pour créer le token d'installation GitHub App.

Tu n'as pas besoin d'ajouter :

- client ID
- client secret
- installation ID

---

## Étape 2 — Activer l'auto-merge du dépôt

Dans **Settings → General** :

1. Descendre jusqu'à **Pull Requests**
2. Activer **Allow auto-merge**

**Pourquoi :**

- les PR contributeurs peuvent devenir auto-mergeables après checks requis
- les PR GitOps bot peuvent devenir auto-mergeables après checks légers requis

---

## Étape 3 — Configurer la gouvernance de `main`

### Option recommandée

Utiliser **Rulesets** plutôt qu'une simple branch protection historique, car la phase 22 introduit deux familles de PR :

- PR contributeurs avec checks lourds
- PR GitOps bot avec checks légers

### Règles minimales à conserver sur `main`

Dans **Settings → Rules → Rulesets** ou **Branch protection rules** :

- exiger une pull request avant merge
- empêcher l'écriture GitOps directe sur `main`
- conserver `main` comme chemin nominal de merge
- exiger des checks requis avant merge

### Important sur le bypass admin

Un administrateur peut toujours garder un bypass GitHub si nécessaire, mais il faut comprendre la différence :

- le bypass GitHub peut autoriser un push ou un merge
- il **ne doit pas** être interprété comme un bypass de déploiement
- après un push direct sur `main`, le dépôt doit toujours exécuter `CI`, `Security` et `CD`
- `CD` doit toujours attendre le vert de `CI` + `Security` avant publication

Autrement dit : un admin peut bypasser la protection de branche, pas la gouvernance de livraison.

---

## Étape 4 — Définir les checks requis pour les PR contributeurs

### Principe

Pour une PR "normale" vers `main`, les checks requis doivent couvrir :

- `CI`
- `Security`
- la validation légère contributeur

### Dans GitHub UI

GitHub affiche souvent des **check runs** par job, pas seulement les noms de workflow. Vérifie la liste exacte dans une vraie PR ouverte.

En pratique, pour une PR contributeur, les checks attendus sont généralement :

- `Backend — test & build`
- `Frontend — lint, test & build`
- `SonarCloud — quality gate`
- `CodeQL — java-kotlin`
- `CodeQL — javascript-typescript`
- `OWASP Dependency-Check — backend`
- `Trivy — backend Docker image`
- `Trivy — frontend Docker image`
- `YAML & manifests`

Si GitHub propose aussi des checks au niveau workflow, garde la logique suivante :

- checks lourds contributeur requis
- pas de dépendance à `GitOps Validation` pour les PR normales

---

## Étape 5 — Définir les checks requis pour les PR GitOps bot

### Comportement attendu du dépôt

Une PR GitOps bot :

- est créée par la GitHub App
- utilise une branche `gitops/bump-images-sha-xxxxxxx`
- utilise un titre `chore(gitops): bump images to sha-xxxxxxx`
- ne doit lancer que `GitOps Validation`

Le check léger attendu est :

- `GitOps light checks`

### Limite GitHub à connaître

GitHub ne permet pas toujours, selon le plan et les rulesets disponibles, de définir des checks requis différents **sur la même branche `main`** en fonction :

- de l'auteur de la PR
- ou du type logique de PR

### Solution réellement retenue

Le dépôt est prêt pour deux niveaux de checks, mais la configuration GitHub peut nécessiter une des deux approches suivantes :

1. **Approche préférée**
   Utiliser des rulesets suffisamment expressifs pour distinguer les PR GitOps bot et n'exiger que `GitOps light checks` pour elles.
2. **Approche de repli**
   Si ton GitHub ne sait pas distinguer proprement les PR GitOps bot, garder la sécurité du flux et merger la PR GitOps manuellement après vérification de `GitOps light checks`.

Dans les deux cas, la sécurité reste préservée parce que :

- il n'y a plus d'écriture GitOps directe sur `main`
- ArgoCD n'attend qu'un merge dans `main`
- le commit GitOps squashé ne relance pas un cycle CD complet

---

## Étape 6 — Vérifier les permissions GitHub App et GitHub Actions

Dans le dépôt, `cd.yml` utilise :

```yaml
permissions:
  contents: write
  pull-requests: write
```

Vérifications à faire :

1. la GitHub App est bien installée sur le dépôt
2. la GitHub App a `Contents: Read and write`
3. la GitHub App a `Pull requests: Read and write`
4. le réglage dépôt autorise bien GitHub Actions à écrire
5. aucune politique d'organisation ne force un token read-only
6. aucun ruleset ne bloque la création de branche GitOps ou la gestion de PR par la GitHub App

Si une politique d'organisation remplace les permissions définies dans le workflow, la PR GitOps pourra échouer même si le YAML du dépôt est correct.

---

## Étape 7 — Nettoyer l'ancienne deploy key SSH

La phase 22 retire le besoin de pousser GitOps directement sur `main` via SSH.

À vérifier :

1. supprimer le secret GitHub `SSH_PRIVATE_KEY` s'il n'est plus utilisé ailleurs
2. supprimer la deploy key d'écriture associée dans **Settings → Deploy keys**
3. retirer tout bypass ruleset devenu inutile pour cette deploy key

**Avant suppression :**

- vérifier qu'aucun autre workflow du dépôt n'utilise encore cette clé
- vérifier qu'au moins une PR GitOps a déjà été créée avec succès via la GitHub App

---

## Étape 8 — Vérifier le flux complet en conditions réelles

### Cas A — PR contributeur

1. Ouvrir une PR vers `main`
2. Vérifier l'exécution de :
   - `CI`
   - `Security`
   - `PR Validation`
3. Activer l'auto-merge si l'utilisateur y est autorisé
4. Vérifier que GitHub n'auto-merge qu'après tous les checks requis
5. Après merge, vérifier que `CD` attend `CI` + `Security` sur le commit `main`

### Cas B — Push admin direct sur `main`

1. Pousser un commit directement sur `main`
2. Vérifier que `CI`, `Security` et `CD` démarrent
3. Vérifier que `CD` reste bloqué dans l'attente de `CI` + `Security`
4. Vérifier que la publication n'a lieu qu'après succès des deux workflows

### Cas C — PR GitOps bot

1. Laisser `cd.yml` publier au moins une image
2. Vérifier la création d'une branche `gitops/bump-images-sha-xxxxxxx`
3. Vérifier l'ouverture d'une PR `chore(gitops): bump images to sha-xxxxxxx`
4. Vérifier que seule la validation légère GitOps tourne
5. Vérifier l'auto-merge si la configuration GitHub le permet
6. Vérifier que le merge final crée un commit `chore(gitops): ...` sur `main`
7. Vérifier que ce commit ne relance pas un cycle CD complet inutile

---

## Étape 9 — Vérifier qu'ArgoCD ne sync qu'après merge

Le point clé à démontrer est le suivant :

- tant que la PR GitOps n'est pas mergée, `main` ne change pas
- tant que `main` ne change pas, ArgoCD ne synchronise pas le nouveau tag

### Vérification pratique

1. Ouvrir la PR GitOps et noter le `newTag` proposé
2. Vérifier que `main` contient encore l'ancien `newTag`
3. Dans ArgoCD, vérifier qu'aucune sync basée sur le nouveau tag n'a encore eu lieu
4. Merger la PR GitOps
5. Vérifier que `main` contient désormais le nouveau `newTag`
6. Vérifier ensuite la synchronisation ArgoCD

Tu peux utiliser :

```bash
argocd app get stockpro
argocd app history stockpro
grep newTag k8s/overlays/gitops/kustomization.yaml
```

---

## Checklist finale

- `Allow auto-merge` activé
- `GITHUB_TOKEN` en `Read and write permissions`
- `GH_APP_ID` présent
- `GH_APP_PRIVATE_KEY` présent
- `Allow GitHub Actions to create and approve pull requests` activé
- protection / ruleset de `main` configuré
- checks requis contributeur définis
- checks légers GitOps définis si GitHub rulesets le permet
- bypass admin compris et documenté
- ancienne deploy key SSH nettoyée si devenue inutile
- PR contributeur testée
- push admin direct testé
- PR GitOps bot testée
- vérification ArgoCD après merge effectuée
