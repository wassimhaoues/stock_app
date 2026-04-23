# Phase 17 — Étapes manuelles après génération des fichiers GitOps

Ce guide liste ce que l’apprenant doit faire lui-même après que l’agent a créé les fichiers ArgoCD et GitOps de la phase 17.

## 1. Vérifier le cluster

```bash
kubectl cluster-info --context kind-stockpro
kubectl get nodes --context kind-stockpro
```

## 2. Installer ArgoCD

Installer ArgoCD dans le cluster existant avec les commandes documentées dans la phase.

## 3. Accéder à l’UI ArgoCD

Exposer temporairement l’interface ArgoCD en local, par exemple avec un port-forward :

```bash
kubectl port-forward -n argocd svc/argocd-server 8080:443
```

Puis ouvrir :

```text
https://localhost:8080
```

## 4. Récupérer le mot de passe initial

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d && echo
```

## 5. Créer ou appliquer l’application ArgoCD

Appliquer le manifest `Application` généré par l’agent.

## 6. Lancer la première synchronisation

- Vérifier que l’application pointe vers le bon dépôt Git.
- Synchroniser manuellement la première fois.
- Vérifier que les ressources Kubernetes apparaissent dans l’état attendu.

## 7. Activer la synchronisation automatique

Une fois la première synchro validée, activer le auto-sync si prévu par les manifests.

## 8. Vérifier le drift

Modifier un fichier Git, pousser le changement, puis vérifier qu’ArgoCD détecte et applique l’écart.

## 9. Corriger si nécessaire

- Vérifier les permissions si ArgoCD ne peut pas lire le dépôt.
- Vérifier l’URL du dépôt et la branche cible.
- Vérifier que le namespace cible existe.
