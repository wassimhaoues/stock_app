# Déploiement Kubernetes local (kind)

## 1. Créer le cluster kind

```bash
# Créer le cluster avec la configuration du projet
kind create cluster --name stockpro --config k8s/overlays/local/kind-cluster.yaml

# Vérifier
kubectl cluster-info --context kind-stockpro
kubectl get nodes
```

## 2. Préparer le fichier de secrets

```bash
# Copier le fichier d'exemple
cp k8s/overlays/local/.env.example k8s/overlays/local/.env

# Éditer les valeurs
nano k8s/overlays/local/.env
```

Le fichier `.env` local doit contenir les mêmes variables que le `.env` racine :

```dotenv
MYSQL_ROOT_PASSWORD=root_secret
MYSQL_DATABASE=stock_app_db
MYSQL_USER=stockpro
MYSQL_PASSWORD=app_secret
JWT_SECRET=votre_cle_jwt_base64
STOCKPRO_DEMO_DATA=true
```

## 3. Construire et charger les images

Les images doivent être construites localement et chargées dans kind (kind n'a pas accès au registry Docker de la machine hôte par défaut).

```bash
# Construire les images
docker build -t stockpro-backend:local ./backend
docker build -t stockpro-frontend:local ./frontend

# Charger les images dans le cluster kind
kind load docker-image stockpro-backend:local --name stockpro
kind load docker-image stockpro-frontend:local --name stockpro

# Vérifier que les images sont disponibles dans kind
docker exec -it stockpro-control-plane crictl images | grep stockpro
```

## 4. Déployer l'application

```bash
# Appliquer l'overlay local (crée le namespace, le Secret, les Deployments et Services)
kubectl apply -k k8s/overlays/local/

# Suivre le démarrage des pods
kubectl get pods -n stockpro -w
```

L'ordre de démarrage est géré par l'`initContainer` du backend qui attend que MySQL soit prêt.

## 5. Vérifier le déploiement

```bash
# État des pods
kubectl get pods -n stockpro

# État des services
kubectl get services -n stockpro

# Logs du backend
kubectl logs -f deployment/stock-backend -n stockpro

# Logs du frontend
kubectl logs -f deployment/stock-frontend -n stockpro

# Logs de MySQL
kubectl logs -f deployment/stock-db -n stockpro
```

## 6. Accéder à l'application

L'overlay local configure des NodePorts :

| Service | URL |
|---------|-----|
| Frontend | http://localhost:30080 |
| Backend | http://localhost:30085/api/health |

```bash
# Vérifier la santé du backend
curl http://localhost:30085/api/health
```

## Commandes de débogage utiles

```bash
# Décrire un pod (événements, raisons d'échec)
kubectl describe pod <nom-du-pod> -n stockpro

# Exécuter un shell dans un pod
kubectl exec -it deployment/stock-backend -n stockpro -- /bin/sh

# Tester la connexion MySQL depuis le pod backend
kubectl exec -it deployment/stock-backend -n stockpro -- \
  wget -qO- http://stock-db:3306 2>&1

# Voir les secrets (encodés en base64)
kubectl get secret stockpro-secrets -n stockpro -o yaml

# Décoder une valeur de secret
kubectl get secret stockpro-secrets -n stockpro \
  -o jsonpath='{.data.MYSQL_PASSWORD}' | base64 -d

# Voir le ConfigMap du backend
kubectl get configmap backend-config -n stockpro -o yaml
```

## Supprimer le déploiement

```bash
# Supprimer les ressources sans supprimer le namespace
kubectl delete -k k8s/overlays/local/

# Supprimer le namespace complet (supprime tout)
kubectl delete namespace stockpro

# Supprimer le cluster kind
kind delete cluster --name stockpro
```

## Reconstruire et redéployer après modification du code

```bash
# Reconstruire les images
docker build -t stockpro-backend:local ./backend
docker build -t stockpro-frontend:local ./frontend

# Recharger dans kind
kind load docker-image stockpro-backend:local --name stockpro
kind load docker-image stockpro-frontend:local --name stockpro

# Forcer le rechargement des pods
kubectl rollout restart deployment/stock-backend -n stockpro
kubectl rollout restart deployment/stock-frontend -n stockpro

# Suivre le rollout
kubectl rollout status deployment/stock-backend -n stockpro
```
