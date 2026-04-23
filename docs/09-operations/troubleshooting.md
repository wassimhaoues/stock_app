# Dépannage général

## Backend ne démarre pas

### Vérifier les logs

```bash
# Docker Compose
docker compose logs stock-backend

# Kubernetes
kubectl logs deployment/stock-backend -n stockpro

# Natif
./mvnw spring-boot:run 2>&1 | tail -50
```

### Causes fréquentes

| Erreur dans les logs | Cause | Solution |
|---------------------|-------|----------|
| `Communications link failure` | MySQL pas accessible | Vérifier que MySQL est démarré et que `DB_HOST` est correct |
| `Access denied for user` | Mauvais identifiants MySQL | Vérifier `DB_USERNAME` et `DB_PASSWORD` dans `.env` |
| `JWT secret is too short` | `JWT_SECRET` trop court | Générer avec `openssl rand -base64 32` |
| `Port 8085 already in use` | Un autre processus utilise le port | `lsof -i :8085` puis arrêter le processus |

## Frontend ne démarre pas

```bash
# Vérifier les logs Docker
docker compose logs stock-frontend

# En mode développement natif
npm start 2>&1 | tail -30
```

**Erreur fréquente : `ENOENT package.json`**

```bash
# Vérifier que vous êtes dans le bon répertoire
cd frontend
npm ci
```

## Erreur "Backend inaccessible" dans le frontend

En Docker Compose, le frontend proxy les requêtes `/api/` vers `stock-backend:8085` via nginx.

Vérifier :

```bash
# Le backend est healthy ?
docker compose ps
# stock-backend doit afficher "(healthy)"

# Tester directement depuis la machine hôte
curl http://localhost:8085/api/health
```

## La base de données est vide après redémarrage

Le script `infra/mysql-init/01-schema.sql` ne s'exécute qu'au **premier démarrage du volume**. Si les tables sont absentes après un redémarrage normal, vérifier :

```bash
# Le volume existe ?
docker volume ls | grep stock_db_data

# Inspecter le volume
docker volume inspect stock-management_stock_db_data

# Se connecter à MySQL pour vérifier les tables
docker exec -it stock-db mysql -u stockpro -p stock_app_db -e "SHOW TABLES;"
```

## Erreur CORS en développement

En développement natif, le frontend (`localhost:4200`) proxy les requêtes via ng serve. Si vous accédez au backend directement depuis un autre port, le backend retourne une erreur CORS.

**Solution :** Toujours utiliser `http://localhost:4200` comme point d'entrée en développement. Ne pas appeler `http://localhost:8085` directement depuis le navigateur.

En cas de besoin, vérifier la variable `CORS_ALLOWED_ORIGINS` du backend.

## Pipeline CI bloqué

### SonarCloud Quality Gate failed

```bash
# Vérifier la couverture locale avant de pousser
cd backend && ./mvnw verify
# Voir : target/site/jacoco/index.html

cd frontend && npm run test:coverage
# Voir : coverage/stockpro-frontend/index.html
```

### npm audit bloque la CI

```bash
cd frontend
npm audit
npm audit fix
git add package-lock.json
git commit -m "fix: update vulnerable dependencies"
```

### Tests backend échouent

```bash
cd backend
./mvnw test
# Voir les détails dans la sortie Maven
# ou : target/surefire-reports/*.txt
```

## Pipeline CD bloqué

### Le job gitops-bump échoue avec "Permission denied"

Vérifier que :
1. Le secret `SSH_PRIVATE_KEY` est bien configuré (contenu complet de la clé)
2. La clé publique est dans Deploy keys avec "Allow write access"
3. Le ruleset autorise les deploy keys à bypasser la protection de `main`

### L'image GHCR n'est pas trouvée par K8s

Après le premier push, les packages GHCR sont privés par défaut.

Rendre le package public : GitHub → profil → Packages → package → Settings → Change visibility → Public.

## Ressources Kubernetes bloquées

### Pod en état Pending

```bash
kubectl describe pod <nom> -n stockpro
# Chercher : "Insufficient cpu" ou "Insufficient memory"
```

Sur kind, les ressources disponibles sont limitées par la mémoire disponible sur la machine hôte.

### Pod en état CrashLoopBackOff

```bash
# Voir les logs du pod qui crash
kubectl logs <nom-du-pod> -n stockpro --previous

# Voir les dernières 50 lignes
kubectl logs <nom-du-pod> -n stockpro --tail=50
```

### Supprimer un namespace bloqué en Terminating

```bash
# Forcer la suppression d'un namespace bloqué
kubectl get namespace stockpro -o json | \
  jq '.spec.finalizers = []' | \
  kubectl replace --raw /api/v1/namespaces/stockpro/finalize -f -
```

## Récupération complète

En cas de problème grave, réinitialiser complètement l'environnement local :

```bash
# Supprimer la stack Docker
docker compose down -v
docker system prune -a

# Supprimer le cluster kind
kind delete cluster --name stockpro

# Repartir depuis zéro
docker compose up -d
# ou
kind create cluster --name stockpro --config k8s/overlays/local/kind-cluster.yaml
kubectl apply -k k8s/overlays/local/
```
