# 05 — GitOps

Cette section regroupe le minimum utile pour comprendre et utiliser le flux GitOps du projet.

| Fichier                                  | Contenu                                             |
| ---------------------------------------- | --------------------------------------------------- |
| [argocd-setup.md](argocd-setup.md)       | Installer ArgoCD, créer l'application, synchroniser |
| [bootstrap.md](bootstrap.md)             | Créer le Secret bootstrap avant la première sync    |
| [troubleshooting.md](troubleshooting.md) | Erreurs de sync, rollback, débogage                 |
| [phase-24-gcp-gke-setup.md](../13-manual-work/phase-24-gcp-gke-setup.md) | Préparer GCP, GKE et l'overlay cloud |

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
- **Chemins :**
  - `k8s/overlays/gitops` pour la cible locale/kind
  - `k8s/overlays/gke` pour la cible cloud GKE

Le changement n'arrive dans ces overlays qu'après merge de la PR GitOps, ce qui garde une trace claire de la version déployée sur chaque cible.

Les réglages GitHub UI associés à ce flux sont détaillés dans [docs/13-manual-work/phase-22-github-governance-setup.md](../13-manual-work/phase-22-github-governance-setup.md).

Pour l'extension cloud planifiée en phase 24, voir aussi [docs/13-manual-work/phase-24-gcp-gke-setup.md](../13-manual-work/phase-24-gcp-gke-setup.md).
