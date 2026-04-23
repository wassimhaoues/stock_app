# Docker Compose

## Démarrage

```bash
# Démarrer tous les services en arrière-plan
docker compose up -d

# Démarrer et afficher les logs en direct
docker compose up

# Démarrer seulement MySQL (pour le développement natif)
docker compose up -d stock-db
```

## État et logs

```bash
# Voir l'état de tous les services
docker compose ps

# Logs de tous les services
docker compose logs

# Logs en temps réel
docker compose logs -f

# Logs d'un service spécifique
docker compose logs -f stock-backend
docker compose logs -f stock-frontend
docker compose logs -f stock-db
```

## Arrêt

```bash
# Arrêter les services sans supprimer les conteneurs
docker compose stop

# Arrêter et supprimer les conteneurs (les données MySQL sont conservées)
docker compose down

# Arrêter, supprimer les conteneurs ET le volume MySQL (RESET COMPLET)
docker compose down -v
```

## Rebuild des images

```bash
# Reconstruire toutes les images
docker compose build

# Reconstruire une seule image
docker compose build stock-backend
docker compose build stock-frontend

# Reconstruire et démarrer en une commande
docker compose up -d --build

# Forcer un rebuild complet sans cache Docker
docker compose build --no-cache
```

## Ports exposés

| Service | Hôte | Conteneur | Description |
|---------|------|-----------|-------------|
| `stock-frontend` | `127.0.0.1:4200` | `80` | Interface Angular (nginx) |
| `stock-backend` | `127.0.0.1:8085` | `8085` | API Spring Boot |
| `stock-db` | `127.0.0.1:3307` | `3306` | MySQL (port 3307 côté hôte pour éviter les conflits) |

> Tous les ports sont liés à `127.0.0.1` uniquement pour des raisons de sécurité. Ils ne sont pas accessibles depuis d'autres machines du réseau.

## Services

### stock-db

- Image : `mysql:8.0`
- Volume persistant : `stock_db_data`
- Initialisation : le schéma SQL est chargé depuis `infra/mysql-init/01-schema.sql` au premier démarrage du volume
- Healthcheck : `mysqladmin ping` toutes les 10 secondes

### stock-backend

- Build depuis `backend/Dockerfile` (multi-stage Maven + JRE 17)
- Profil Spring : `docker`
- Démarre seulement quand `stock-db` est `healthy`
- Healthcheck : `GET /api/health`

### stock-frontend

- Build depuis `frontend/Dockerfile` (multi-stage Node + nginx)
- nginx sert le build Angular et proxy `/api/` vers `stock-backend:8085`
- Démarre seulement quand `stock-backend` est `healthy`

## phpMyAdmin (outil d'administration)

```bash
cd infra
docker compose up -d
```

Accessible sur http://localhost:8084.

Configuration :
- Hôte : `host.docker.internal` → pointe vers le MySQL sur le port 3307 de la machine hôte
- Connexion avec `stockpro` / `votre_mot_de_passe` ou `root` / `MYSQL_ROOT_PASSWORD`

Arrêter phpMyAdmin :

```bash
cd infra
docker compose down
```

## Volumes

```bash
# Lister les volumes
docker volume ls | grep stock

# Inspecter le volume MySQL
docker volume inspect stock-management_stock_db_data

# Supprimer le volume MySQL (IRRÉVERSIBLE - supprime toutes les données)
docker volume rm stock-management_stock_db_data
```

## Nettoyage global Docker

```bash
# Supprimer les images inutilisées
docker image prune

# Supprimer tous les conteneurs arrêtés, images orphelines, volumes et réseaux inutilisés
docker system prune -a --volumes
```
