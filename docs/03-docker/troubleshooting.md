# Dépannage Docker

## Le conteneur stock-backend redémarre en boucle

**Symptôme :** `docker compose ps` montre `stock-backend` en état `restarting`.

**Diagnostic :**

```bash
docker compose logs stock-backend
```

**Causes fréquentes :**

| Cause | Solution |
|-------|----------|
| MySQL pas encore prêt | Attendre que `stock-db` passe à `healthy`. Le healthcheck prend jusqu'à 60 secondes. |
| Variable `JWT_SECRET` absente | Vérifier que `.env` contient `JWT_SECRET` et que la valeur est non vide. |
| Erreur de connexion MySQL | Vérifier `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` dans `.env`. |

## Le port 3307 est déjà utilisé

**Symptôme :** `Error starting userland proxy: listen tcp 0.0.0.0:3307: bind: address already in use`

**Solution :**

```bash
# Identifier le processus qui utilise le port
lsof -i :3307
# ou
ss -tlnp | grep 3307

# Arrêter le processus ou modifier le port dans docker-compose.yml
```

## Le port 4200 est déjà utilisé

Le serveur de développement Angular natif utilise aussi le port 4200.

```bash
# Arrêter le serveur ng serve en cours
# ou modifier temporairement le port dans docker-compose.yml :
# ports:
#   - "127.0.0.1:4201:80"
```

## Les données MySQL ne persistent pas

**Symptôme :** Les données sont perdues à chaque `docker compose down`.

**Cause :** Utilisation de `docker compose down -v` (supprime le volume).

**Solution :** Utiliser `docker compose down` sans le flag `-v` pour conserver les données.

## Le schéma SQL n'est pas rechargé

Le script `infra/mysql-init/01-schema.sql` est exécuté uniquement lors du **premier démarrage du volume**. Si le volume existe déjà, MySQL ne ré-exécute pas les scripts d'initialisation.

Pour forcer un rechargement complet :

```bash
docker compose down -v
docker compose up -d
```

> Attention : cette commande supprime toutes les données MySQL existantes.

## L'image frontend ne se recharge pas après modification du code

Les modifications de code source ne sont pas automatiquement reflétées dans les conteneurs Docker. Il faut rebuilder l'image :

```bash
docker compose build stock-frontend
docker compose up -d stock-frontend
```

Pour le développement actif, préférer le serveur de développement Angular natif (`npm start`) plutôt que le conteneur Docker.

## Accès refusé depuis phpMyAdmin

**Symptôme :** phpMyAdmin affiche "Access denied for user".

**Causes :**

1. Le port `3307` du MySQL n'est pas exposé (la stack principale n'est pas démarrée)
2. Mauvais identifiants → utiliser `stockpro` / `MYSQL_PASSWORD` depuis `.env`
3. `host.docker.internal` n'est pas résolu → présent uniquement sur Linux avec `extra_hosts` configuré dans `infra/docker-compose.yml`

## Healthcheck du backend échoue

```bash
# Vérifier l'état du healthcheck
docker inspect stock-backend | grep -A 10 Health

# Tester manuellement le endpoint
docker exec stock-backend wget -qO- http://localhost:8085/api/health
```

## Espace disque insuffisant

```bash
# Voir l'espace utilisé par Docker
docker system df

# Nettoyage (attention : supprime les images non utilisées)
docker system prune
```
