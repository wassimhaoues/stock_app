# 05 — GitOps

Cette section regroupe le minimum utile pour comprendre et utiliser le flux GitOps du projet.

| Fichier                                  | Contenu                                             |
| ---------------------------------------- | --------------------------------------------------- |
| [argocd-setup.md](argocd-setup.md)       | Installer ArgoCD, créer l'application, synchroniser |
| [bootstrap.md](bootstrap.md)             | Créer le Secret bootstrap avant la première sync    |
| [troubleshooting.md](troubleshooting.md) | Erreurs de sync, rollback, débogage                 |

## Flux retenu

```
merge sur main
    → CI et Security
    → build et publication des images GHCR
    → PR GitOps avec mise à jour des tags
    → merge de la PR GitOps
    → synchronisation ArgoCD
```

## Source de vérité

ArgoCD surveille :

- **Dépôt :** `https://github.com/wassimhaoues/stock_app.git`
- **Branche :** `main`
- **Chemin :** `k8s/overlays/gitops`

Le changement n'arrive dans cet overlay qu'après merge de la PR GitOps, ce qui garde une trace claire de la version déployée.

Les réglages GitHub UI associés à ce flux sont détaillés dans [docs/13-manual-work/phase-22-github-governance-setup.md](../13-manual-work/phase-22-github-governance-setup.md).
