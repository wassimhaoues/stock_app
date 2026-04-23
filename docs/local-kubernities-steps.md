# Phase 16 — Runbook de déploiement Kubernetes local

Ce guide décrit toutes les étapes manuelles pour déployer StockPro dans un cluster
Kubernetes local avec **kind**. Les manifests sont dans `k8s/`. Les secrets sont générés
automatiquement depuis le fichier `.env` racine — aucune valeur sensible dans les fichiers YAML.

---

## Prérequis

Vérifier que les outils suivants sont installés et disponibles dans le PATH :

```bash
docker --version      # >= 20.10
kind --version        # >= 0.20
kubectl version       # client >= 1.28
```

Si `kind` n'est pas installé :

```bash
# Linux
curl -Lo /usr/local/bin/kind \
  https://kind.sigs.k8s.io/dl/v0.23.0/kind-linux-amd64
chmod +x /usr/local/bin/kind
```

---

## Étape 1 — Vérifier le fichier .env

Les secrets Kubernetes sont générés automatiquement depuis le fichier `.env` racine
par Kustomize (`secretGenerator`). Il n'y a **aucun fichier secret YAML à éditer**.

Vérifier que le `.env` est présent et contient les bonnes valeurs :

```bash
cat .env
```

Le `.env` doit contenir exactement ces clés (les valeurs sont celles de ton environnement) :

```env
MYSQL_ROOT_PASSWORD=...
MYSQL_DATABASE=stock_app_db
MYSQL_USER=stockpro
MYSQL_PASSWORD=...
JWT_SECRET=...
STOCKPRO_DEMO_DATA=true
```

Si le `.env` n'existe pas, le copier depuis l'exemple et renseigner les valeurs :

```bash
cp .env.example .env
# puis éditer .env avec les vraies valeurs
```

> Le `.env` est dans `.gitignore` — il ne sera jamais commité. Les fichiers YAML
> dans `k8s/` ne contiennent aucune valeur sensible.

---

## Étape 2 — Créer le cluster kind

Le fichier `k8s/overlays/local/kind-cluster.yaml` configure kind pour exposer
les NodePorts sur localhost :

- **30080** → frontend Angular
- **30085** → API backend (Swagger, Postman)

```bash
kind create cluster --config k8s/overlays/local/kind-cluster.yaml
```

Vérifier que le cluster est actif :

```bash
kubectl cluster-info --context kind-stockpro
kubectl get nodes
```

Résultat attendu :

```
NAME                     STATUS   ROLES           AGE
stockpro-control-plane   Ready    control-plane   Xs
```

---

## Étape 3 — Construire les images Docker

kind est isolé du daemon Docker de l'hôte — les images locales ne sont pas partagées
automatiquement. Elles doivent être construites puis chargées explicitement.

```bash
docker build -t stockpro-backend:local ./backend
docker build -t stockpro-frontend:local ./frontend
```

---

## Étape 4 — Charger les images dans kind

```bash
kind load docker-image stockpro-backend:local --name stockpro
kind load docker-image stockpro-frontend:local --name stockpro
```

Vérification :

```bash
docker exec stockpro-control-plane crictl images | grep stockpro
```

L'image MySQL (`mysql:8.0`) est téléchargée depuis Docker Hub automatiquement — pas
besoin de la charger manuellement.

---

## Étape 5 — Préparer les fichiers locaux pour Kustomize

Kustomize ne peut charger que des fichiers situés **dans** l'arbre de sa racine.
Deux fichiers doivent donc être copiés dans les bons emplacements avant le déploiement.

**Le fichier .env** (secrets) — copier à la racine de l'overlay local :

```bash
cp .env k8s/overlays/local/.env
```

Ce fichier est gitignore — il ne sera jamais commité. À refaire si le `.env` racine change.

**Le schéma SQL** (initialisation MySQL) — déjà en place dans `k8s/base/assets/01-schema.sql`.
Ce fichier est tracké dans git. Si `infra/mysql-init/01-schema.sql` est modifié,
mettre à jour `k8s/base/assets/01-schema.sql` également.

---

## Étape 6 — Appliquer les manifests

Une seule commande déploie toute la stack :

```bash
kubectl apply -k k8s/overlays/local
```

Ce que Kustomize fait en arrière-plan :

1. Lit `k8s/overlays/local/.env` et crée le Secret `stockpro-secrets`
2. Génère le ConfigMap `mysql-init-sql` depuis `k8s/base/assets/01-schema.sql`
3. Crée le namespace, le PVC, les ConfigMaps, les Deployments et les Services

Pour prévisualiser ce qui sera appliqué sans rien déployer :

```bash
kubectl kustomize k8s/overlays/local
```

---

## Étape 7 — Suivre le démarrage

MySQL démarre en premier. Le backend attend MySQL via l'initContainer `wait-for-mysql`,
puis le frontend. Compter environ 2-3 minutes au total.

```bash
# Suivre l'état de tous les pods en temps réel
kubectl get pods -n stockpro -w
```

Consulter les logs par composant :

```bash
# Logs de l'initContainer du backend (attend MySQL)
kubectl logs -n stockpro -l component=backend -c wait-for-mysql

# Logs du backend Spring Boot
kubectl logs -n stockpro -l component=backend -f

# Logs MySQL
kubectl logs -n stockpro -l component=mysql -f
```

Vérifier le statut des rollouts :

```bash
kubectl rollout status deployment/mysql -n stockpro
kubectl rollout status deployment/stock-backend -n stockpro
kubectl rollout status deployment/stock-frontend -n stockpro
```

État attendu une fois tout déployé :

```
NAME                              READY   STATUS    RESTARTS
mysql-xxx                         1/1     Running   0
stock-backend-xxx                 1/1     Running   0
stock-frontend-xxx                1/1     Running   0
```

---

## Étape 8 — Vérifier les accès

```bash
# Health check du backend
curl http://localhost:30085/api/health
```

Depuis le navigateur :

- **Application** : http://localhost:30080
- **Swagger UI** : http://localhost:30085/swagger-ui.html

Comptes de connexion créés par le DataInitializer (`STOCKPRO_DEMO_DATA=true`) :

| Rôle         | Email                       | Mot de passe |
| ------------ | --------------------------- | ------------ |
| ADMIN        | admin@stockpro.local        | Admin123!    |
| GESTIONNAIRE | gestionnaire@stockpro.local | Gestion123!  |
| OBSERVATEUR  | observateur@stockpro.local  | Observe123!  |

---

## Étape 9 — Commandes de diagnostic utiles

```bash
# Lister tous les pods et leur état
kubectl get pods -n stockpro

# Lister les services et leurs ports
kubectl get svc -n stockpro

# Décrire un pod (events, erreurs de scheduling, probe failures)
kubectl describe pod -n stockpro <pod-name>

# Vérifier que le Secret a bien été créé depuis le .env
kubectl get secret stockpro-secrets -n stockpro
kubectl describe secret stockpro-secrets -n stockpro

# Vérifier les variables d'environnement injectées dans le backend
kubectl exec -n stockpro deployment/stock-backend -- env | grep -E "DB_|JWT_|SPRING_|STOCKPRO_"

# Accéder à MySQL directement depuis le cluster
kubectl exec -n stockpro deployment/mysql -- \
  mysql -u stockpro -pStockProApp+2026 stock_app_db -e "SHOW TABLES;"
```

---

## Étape 10 — Arrêter et relancer

```bash
# Supprimer toutes les ressources Kubernetes (le PVC et ses données persistent)
kubectl delete -k k8s/overlays/local

# Supprimer aussi les données MySQL (PVC)
kubectl delete pvc mysql-pvc -n stockpro

# Supprimer complètement le cluster (tout est supprimé, y compris les volumes)
kind delete cluster --name stockpro
```

Relancer après un rebuild d'image :

```bash
docker build -t stockpro-backend:local ./backend
kind load docker-image stockpro-backend:local --name stockpro
kubectl rollout restart deployment/stock-backend -n stockpro
```

---

## Erreurs fréquentes

| Symptôme                                  | Cause probable                        | Solution                                                                                                                                                              |
| ----------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ImagePullBackOff`                        | Image non chargée dans kind           | `kind load docker-image stockpro-backend:local --name stockpro`                                                                                                       |
| Backend en `CrashLoopBackOff`             | MySQL pas encore prêt                 | Vérifier les logs : `kubectl logs -n stockpro -l component=backend -c wait-for-mysql`                                                                                 |
| `Connection refused` sur port 30080/30085 | Cluster créé sans `kind-cluster.yaml` | Recréer : `kind delete cluster --name stockpro` puis `kind create cluster --config k8s/overlays/local/kind-cluster.yaml`                                              |
| Erreur JDBC au démarrage                  | Mauvais mot de passe dans `.env`      | Vérifier que `MYSQL_PASSWORD` dans `k8s/overlays/local/.env` correspond à la valeur utilisée à la création du PVC MySQL (si le PVC existe déjà, supprimer et recréer) |
| Secret `stockpro-secrets` absent          | `.env` non copié dans l'overlay       | Exécuter `cp .env k8s/overlays/local/.env` puis réappliquer                                                                                                           |
| `no matches for kind "Kustomization"`     | kubectl trop ancien                   | Mettre à jour kubectl >= 1.28                                                                                                                                         |
| Pod MySQL redémarre en boucle             | Données corrompues dans le PVC        | `kubectl delete pvc mysql-pvc -n stockpro` puis réappliquer                                                                                                           |

### Test MySQL with phpMyAdmin

In one terminal, keep the MySQL port-forward running:

```bash
kubectl port-forward --address 0.0.0.0 -n stockpro service/stock-db 3307:3306
```

In another terminal, start phpMyAdmin from the `infra` folder:

```bash
cd infra
docker compose up -d
```

Then open:

```text
http://localhost:8084
```

Use these connection values in phpMyAdmin:

- **Host:** `host.docker.internal`
- **Port:** `3307`
- **User:** the `MYSQL_USER` value from `k8s/overlays/local/.env`
- **Password:** the `MYSQL_PASSWORD` value from `k8s/overlays/local/.env`
