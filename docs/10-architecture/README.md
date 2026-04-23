# 10 — Architecture

| Fichier | Contenu |
|---------|---------|
| [overview.md](overview.md) | Vue d'ensemble complète : backend, frontend, base de données, infra, CI/CD, GitOps |
| [folder-structure.md](folder-structure.md) | Structure du dépôt annotée |

## Décisions techniques verrouillées

| Décision | Choix |
|----------|-------|
| Framework UI | Angular Material |
| Langue de l'interface | Français |
| Authentification | JWT stateless |
| Rôles utilisateurs | ADMIN / GESTIONNAIRE / OBSERVATEUR |
| Nom de l'application | StockPro |
| Versioning des images | SHA court (`sha-XXXXXXX`) |
| Source de vérité GitOps | `k8s/overlays/gitops` sur `main` |
