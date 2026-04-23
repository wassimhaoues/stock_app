# 05 — GitOps

Cette section couvre ArgoCD, le bootstrap manuel et le dépannage du flux GitOps.

| Fichier | Contenu |
|---------|---------|
| [argocd-setup.md](argocd-setup.md) | Installer ArgoCD, créer l'application, synchroniser |
| [bootstrap.md](bootstrap.md) | Créer le Secret bootstrap avant la première sync |
| [troubleshooting.md](troubleshooting.md) | Erreurs de sync, rollback, débogage |

## Vue d'ensemble du flux GitOps

```
merge sur main
    → CI verte (tests, qualité, sécurité)
    → cd.yml détecte les changements (backend / frontend)
    → Build et push des images vers GHCR avec tag sha-XXXXXXX
    → cd.yml met à jour k8s/overlays/gitops/kustomization.yaml (newTag)
    → cd.yml pousse le commit GitOps sur main (via SSH deploy key)
    → ArgoCD détecte le changement Git (auto-sync activé)
    → ArgoCD applique le kustomization.yaml mis à jour
    → Les pods sont remplacés par les nouvelles images
```

## Source de vérité

ArgoCD surveille :
- **Dépôt :** `https://github.com/wassimhaoues/stock_app.git`
- **Branche :** `main`
- **Chemin :** `k8s/overlays/gitops`

Toute modification dans ce chemin déclenche une synchronisation automatique.
