# 04 — Kubernetes

Cette section couvre le déploiement local sur un cluster kind (Kubernetes in Docker).

| Fichier | Contenu |
|---------|---------|
| [local-cluster.md](local-cluster.md) | Créer un cluster kind, charger les images, appliquer les manifests |
| [manifests.md](manifests.md) | Structure et rôle de chaque fichier K8s |

## Architecture K8s

```
k8s/
├── base/           Manifests communs à tous les environnements
├── overlays/
│   ├── local/      Overlay pour kind (images locales, NodePort)
│   └── gitops/     Overlay pour ArgoCD (images GHCR, SHA tag)
└── argocd/         Manifests ArgoCD (Application + namespace)
```

## Overlays disponibles

| Overlay | Usage | Images | Secret |
|---------|-------|--------|--------|
| `local` | Développement sur kind | Chargées manuellement | Généré par Kustomize depuis `.env` |
| `gitops` | Production via ArgoCD | GHCR (`sha-XXXXXXX`) | Bootstrap manuel unique |

## Prérequis

- kind 0.22+
- kubectl 1.29+
- kustomize 5.x

Voir [01-getting-started/prerequisites.md](../01-getting-started/prerequisites.md).
