# 03 — Docker

| Fichier | Contenu |
|---------|---------|
| [compose.md](compose.md) | Utiliser Docker Compose : démarrage, logs, rebuild, reset |
| [troubleshooting.md](troubleshooting.md) | Erreurs fréquentes et solutions |

## Fichiers Docker du projet

| Fichier | Rôle |
|---------|------|
| `docker-compose.yml` | Stack applicative principale : MySQL + Backend + Frontend |
| `backend/Dockerfile` | Build multi-stage Maven → JRE 17 |
| `frontend/Dockerfile` | Build multi-stage Node → nginx |
| `infra/docker-compose.yml` | phpMyAdmin uniquement (outil d'administration) |
