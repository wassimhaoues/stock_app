# Installation et configuration d'ArgoCD

## Prérequis

- Cluster Kubernetes en cours d'exécution (kind ou autre)
- kubectl configuré avec le bon contexte
- ArgoCD CLI installé

Voir [04-kubernetes/local-cluster.md](../04-kubernetes/local-cluster.md) pour créer le cluster.

## 1. Installer ArgoCD dans le cluster

```bash
# Créer le namespace ArgoCD
kubectl apply -f k8s/argocd/namespace.yaml

# Installer ArgoCD (manifests officiels)
kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Attendre que les pods ArgoCD soient prêts
kubectl get pods -n argocd -w
# Attendre que tous les pods soient en Running
```

## 2. Accéder à l'interface ArgoCD

```bash
# Port-forward vers l'interface web
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Ouvrir dans le navigateur
# https://localhost:8080 (ignorer l'avertissement TLS self-signed)
```

### Récupérer le mot de passe admin initial

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
echo
```

### Se connecter via le CLI

```bash
argocd login localhost:8080 \
  --username admin \
  --password <mot_de_passe_récupéré> \
  --insecure
```

## 3. Créer le Secret bootstrap

**Avant de déployer l'application ArgoCD**, le Secret `stockpro-secrets` doit exister dans le namespace `stockpro`. ArgoCD ne le crée pas et ne le modifie jamais.

Voir [bootstrap.md](bootstrap.md) pour la procédure complète.

## 4. Déployer l'application ArgoCD

```bash
# Créer le namespace stockpro si absent
kubectl create namespace stockpro --dry-run=client -o yaml | kubectl apply -f -

# Appliquer le manifest de l'application ArgoCD
kubectl apply -f k8s/argocd/stockpro-app.yaml
```

Le manifest `k8s/argocd/stockpro-app.yaml` configure ArgoCD pour surveiller `k8s/overlays/gitops` sur la branche `main`.

## 5. Vérifier la synchronisation

```bash
# État de l'application ArgoCD
argocd app get stockpro

# Synchronisation manuelle (si l'auto-sync n'a pas encore déclenché)
argocd app sync stockpro

# Suivre la progression
argocd app wait stockpro --health
```

Ou via l'interface web : https://localhost:8080 → Application `stockpro`.

## 6. Vérifier les pods déployés

```bash
kubectl get pods -n stockpro
kubectl get services -n stockpro

# Tester le backend
curl http://localhost:30085/api/health
```

## Configuration de l'application ArgoCD

Le fichier `k8s/argocd/stockpro-app.yaml` contient :

```yaml
spec:
  source:
    repoURL: https://github.com/wassimhaoues/stock_app.git
    targetRevision: main
    path: k8s/overlays/gitops
  syncPolicy:
    automated:
      prune: false      # Ne supprime pas les ressources retirées du repo (sécurité)
      selfHeal: true    # Corrige automatiquement les dérives du cluster
```

`selfHeal: true` signifie qu'ArgoCD réapplique les manifests si un changement manuel est effectué directement dans le cluster (kubectl edit, kubectl delete, etc.).

## Commandes ArgoCD utiles

```bash
# Lister les applications
argocd app list

# Voir les détails et l'état de santé
argocd app get stockpro

# Synchronisation manuelle
argocd app sync stockpro

# Voir l'historique des synchronisations
argocd app history stockpro

# Rollback à une révision précédente
argocd app rollback stockpro <revision_id>

# Voir les ressources gérées
argocd app resources stockpro

# Forcer une synchronisation (écrase les modifications manuelles)
argocd app sync stockpro --force
```
