# 01 — Démarrage

Cette section couvre tout ce dont vous avez besoin pour lancer StockPro sur un nouveau poste.

| Fichier | Contenu |
|---------|---------|
| [prerequisites.md](prerequisites.md) | Outils à installer, versions minimales, commandes de vérification |
| [local-setup.md](local-setup.md) | Lancer l'application en local étape par étape |
| [environment-variables.md](environment-variables.md) | Toutes les variables d'environnement, valeurs par défaut, description |

## Choix du mode de lancement

| Mode | Quand l'utiliser | Guide |
|------|------------------|-------|
| **Docker Compose** | Démonstration rapide, premier lancement | [local-setup.md](local-setup.md) |
| **Natif** (Maven + npm) | Développement actif avec hot-reload | [02-development](../02-development/) |
| **Kubernetes local** (kind) | Tester les manifests K8s | [04-kubernetes](../04-kubernetes/) |
| **GitOps + ArgoCD** | Valider le flux CD automatisé | [05-gitops](../05-gitops/) |
