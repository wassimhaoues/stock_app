# Phase 17 — Runbook GitOps avec ArgoCD (local kind)

Ce guide décrit toutes les étapes manuelles pour transformer le déploiement Kubernetes existant
en flux GitOps piloté par ArgoCD. Les manifests sont dans `k8s/argocd/` et `k8s/overlays/gitops/`.

**Principe GitOps :** le dépôt Git est la seule source de vérité. ArgoCD surveille le dépôt et
maintient le cluster en conformité avec ce qu'il y lit. Toute modification du cluster sans passer
par Git est détectée comme un écart (drift) et peut être corrigée automatiquement.

---

## Prérequis

Le cluster kind `stockpro` doit déjà exister et fonctionner (voir Phase 16).

```bash
kubectl cluster-info --context kind-stockpro
kubectl get nodes
```

Résultat attendu :
```
NAME                     STATUS   ROLES           AGE
stockpro-control-plane   Ready    control-plane   Xs
```

---

## Étape 1 — Pousser les fichiers GitOps sur GitHub

ArgoCD clone le dépôt Git pour lire les manifests. Les fichiers doivent être sur GitHub avant
toute synchronisation.

```bash
git add k8s/argocd/ k8s/overlays/gitops/
git commit -m "feat(k8s): add ArgoCD application manifest and gitops overlay"
git push origin feature/devops-phase-17-argocd
```

> **Important :** le fichier `k8s/overlays/gitops/.env` n'existe pas et ne doit jamais être commité.
> Le Secret est créé manuellement à l'étape 3.

---

## Étape 2 — Installer ArgoCD dans le cluster

ArgoCD s'installe dans son propre namespace. Cette commande crée le namespace et déploie
tous les composants ArgoCD (API server, repo server, application controller, Redis, Dex).

```bash
# Créer le namespace argocd
kubectl apply -f k8s/argocd/namespace.yaml

# Installer ArgoCD (version stable officielle)
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

Attendre que tous les pods ArgoCD soient prêts (environ 2-3 minutes) :

```bash
kubectl get pods -n argocd -w
```

État attendu :
```
NAME                                                READY   STATUS    RESTARTS
argocd-application-controller-xxx                   1/1     Running   0
argocd-dex-server-xxx                               1/1     Running   0
argocd-notifications-controller-xxx                 1/1     Running   0
argocd-redis-xxx                                    1/1     Running   0
argocd-repo-server-xxx                              1/1     Running   0
argocd-server-xxx                                   1/1     Running   0
```

---

## Étape 3 — Créer le Secret bootstrap (une seule fois)

L'overlay GitOps ne contient pas de `secretGenerator` car le `.env` est gitignore et
ArgoCD ne peut pas lire des fichiers hors du dépôt. Le Secret est créé manuellement
**une fois** depuis la racine du projet, avant la première synchronisation ArgoCD.

```bash
kubectl create secret generic stockpro-secrets \
  --from-env-file=.env \
  -n stockpro
```

> Ce Secret n'est pas géré par ArgoCD (`prune: false` dans la sync policy). Il persiste
> entre les synchronisations. Si le `.env` change, recréer le Secret manuellement :
> ```bash
> kubectl delete secret stockpro-secrets -n stockpro
> kubectl create secret generic stockpro-secrets --from-env-file=.env -n stockpro
> ```

Vérifier que le Secret existe et contient les bonnes clés :

```bash
kubectl get secret stockpro-secrets -n stockpro
kubectl describe secret stockpro-secrets -n stockpro
```

---

## Étape 4 — Accéder à l'interface ArgoCD

ArgoCD expose son UI via HTTPS. En local avec kind, utiliser un port-forward.
Ouvrir un terminal dédié (la commande reste active) :

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Puis ouvrir dans le navigateur : **https://localhost:8080**

> Le certificat est auto-signé — accepter l'exception de sécurité dans le navigateur.

---

## Étape 5 — Récupérer le mot de passe initial

ArgoCD génère un mot de passe admin aléatoire à l'installation. Le récupérer ainsi :

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo
```

Se connecter à l'UI avec :
- **Utilisateur :** `admin`
- **Mot de passe :** la valeur affichée par la commande ci-dessus

> Changer le mot de passe après la première connexion via l'UI (User Info → Update Password).

---

## Étape 6 — Appliquer le manifest Application

Ce fichier dit à ArgoCD de surveiller le dépôt Git et d'y lire `k8s/overlays/gitops` :

```bash
kubectl apply -f k8s/argocd/stockpro-app.yaml
```

Vérifier que l'Application est visible dans ArgoCD :

```bash
kubectl get application -n argocd
```

Résultat attendu :
```
NAME       SYNC STATUS   HEALTH STATUS
stockpro   OutOfSync     Missing
```

`OutOfSync` est normal à ce stade — ArgoCD a vu les manifests Git mais ne les a pas encore
appliqués. `Missing` indique que les ressources n'existent pas encore dans le cluster.

> Si le cluster a déjà les pods StockPro (Phase 16), le statut sera `OutOfSync / Healthy`.
> ArgoCD détecte que l'état réel et l'état Git ne concordent pas (versions différentes, etc.).

---

## Étape 7 — Première synchronisation manuelle

Synchroniser manuellement pour valider que tout fonctionne avant d'activer l'automatisme :

```bash
# Via la CLI argocd (si installée)
argocd app sync stockpro

# OU via kubectl (déclenche une synchro manuelle)
kubectl patch application stockpro -n argocd \
  --type merge \
  -p '{"operation":{"initiatedBy":{"username":"admin"},"sync":{"revision":"HEAD"}}}'
```

Depuis l'UI ArgoCD :
1. Cliquer sur l'application `stockpro`
2. Cliquer sur **Sync** → **Synchronize**
3. Observer les ressources apparaître une par une

Attendre que le statut passe à **Synced / Healthy** :

```bash
kubectl get application -n argocd -w
```

Vérifier que les pods StockPro sont toujours en marche :

```bash
kubectl get pods -n stockpro
```

---

## Étape 8 — Vérifier l'accès à l'application

```bash
curl http://localhost:30085/api/health
```

Depuis le navigateur :
- **Application :** http://localhost:30080
- **Swagger UI :** http://localhost:30085/swagger-ui.html

---

## Étape 9 — Activer la synchronisation automatique

Une fois la première sync manuelle validée, activer l'auto-sync en décommentant
le bloc `automated` dans `k8s/argocd/stockpro-app.yaml` :

```yaml
syncPolicy:
  syncOptions:
    - CreateNamespace=true
    - ServerSideApply=true
  automated:
    prune: false    # ne supprime pas les ressources retirées de Git
    selfHeal: true  # corrige automatiquement les dérives cluster → Git
```

Puis pousser et réappliquer :

```bash
git add k8s/argocd/stockpro-app.yaml
git commit -m "feat(argocd): enable automated sync with selfHeal"
git push
kubectl apply -f k8s/argocd/stockpro-app.yaml
```

ArgoCD détecte les changements du dépôt toutes les **3 minutes** par défaut.
Pour forcer une détection immédiate : **Refresh** dans l'UI ou `argocd app get stockpro --refresh`.

---

## Étape 10 — Tester le drift (démo GitOps)

Cette étape montre concrètement l'intérêt du GitOps : ArgoCD détecte et corrige tout écart
entre le cluster réel et le dépôt Git.

**Scénario : modifier une ressource directement dans le cluster**

```bash
# Scaler le frontend à 2 réplicas directement dans le cluster (hors Git)
kubectl scale deployment stock-frontend -n stockpro --replicas=2
```

Avec `selfHeal: true`, ArgoCD détectera l'écart dans les 3 minutes et remettra à 1 réplica
(valeur définie dans Git). Observer dans l'UI ArgoCD : le statut passe brièvement à `OutOfSync`
puis revient à `Synced`.

**Scénario : modifier Git et observer la propagation**

```bash
# Par exemple, augmenter les replicas frontend dans le manifest Git
# Éditer k8s/base/frontend/deployment.yaml : replicas: 1 → replicas: 2
git add k8s/base/frontend/deployment.yaml
git commit -m "test: scale frontend to 2 replicas"
git push
```

ArgoCD détecte le changement et applique automatiquement. Vérifier :

```bash
kubectl get deployment stock-frontend -n stockpro
```

> Ne pas oublier de revenir à `replicas: 1` après la démo.

---

## Étape 11 — Commandes de diagnostic ArgoCD

```bash
# État de l'application
kubectl get application stockpro -n argocd -o yaml

# Historique des synchronisations
kubectl get application stockpro -n argocd \
  -o jsonpath='{.status.history}' | jq .

# Logs du contrôleur ArgoCD (pour déboguer)
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller -f

# Logs du repo server (pour déboguer les erreurs Git/Kustomize)
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-repo-server -f
```

---

## Étape 12 — Arrêter et nettoyer

```bash
# Supprimer l'Application ArgoCD (et les ressources déployées si finalizer actif)
kubectl delete -f k8s/argocd/stockpro-app.yaml

# Désinstaller ArgoCD
kubectl delete -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl delete namespace argocd

# Supprimer complètement le cluster
kind delete cluster --name stockpro
```

---

## Erreurs fréquentes

| Symptôme | Cause probable | Solution |
|---|---|---|
| `ComparisonError: failed to load target state` | URL du dépôt incorrecte ou dépôt privé sans credentials | Vérifier `repoURL` dans `stockpro-app.yaml` ; si privé, configurer un accès HTTPS via l'UI ArgoCD → Settings → Repositories |
| `OutOfSync` persistant après sync | Ressource hors du scope ArgoCD (ex: le Secret bootstrap) | Normal pour `stockpro-secrets` — ArgoCD ne le gère pas (`prune: false`) |
| `Degraded` sur l'application | Un pod est en erreur dans le cluster | `kubectl get pods -n stockpro` puis `kubectl describe pod <nom>` |
| `ImagePullBackOff` après sync | Image `:local` non chargée dans kind | `kind load docker-image stockpro-backend:local --name stockpro` |
| ArgoCD ne voit pas le dépôt GitHub | Dépôt privé | UI ArgoCD → Settings → Repositories → Connect Repo → HTTPS avec token GitHub |
| `unable to resolve secret` au démarrage | Secret `stockpro-secrets` absent | Exécuter l'étape 3 (création manuelle du Secret) |
| Port-forward coupé | Terminal fermé ou timeout | Relancer `kubectl port-forward svc/argocd-server -n argocd 8080:443` |
