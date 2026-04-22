# Phase 16 — Étapes manuelles après génération des manifests

Ce guide liste ce que l’apprenant doit faire lui-même après que l’agent a créé les fichiers Kubernetes de la phase 16.

## 1. Vérifier les prérequis

- Docker doit être installé et lancé.
- `kind` doit être disponible.
- `kubectl` doit être disponible.
- Le contexte Kubernetes doit pointer vers le cluster kind du projet.

## 2. Vérifier le cluster

```bash
kubectl cluster-info --context kind-stockpro
kubectl get nodes --context kind-stockpro
```

## 3. Construire les images Docker

Construire les images du backend et du frontend à partir de leurs `Dockerfile`.

```bash
docker build -t stockpro-backend:local ./backend
docker build -t stockpro-frontend:local ./frontend
```

## 4. Charger les images dans kind

Les images construites localement doivent être importées dans le cluster kind pour être utilisées par Kubernetes.

```bash
kind load docker-image stockpro-backend:local --name stockpro
kind load docker-image stockpro-frontend:local --name stockpro
```

L’image MySQL vient du registre public déclaré dans le manifest Kubernetes, donc elle n’a pas besoin d’être chargée manuellement.

## 5. Appliquer les manifests

```bash
kubectl apply -k k8s/overlays/local
```

Appliquer ensuite, si besoin, les ressources dans l’ordre logique défini par les manifests : namespace, MySQL, backend, frontend.

## 6. Vérifier l’état du déploiement

```bash
kubectl get pods -n <namespace>
kubectl get svc -n <namespace>
kubectl logs -n <namespace> <pod-name>
kubectl rollout status deployment/<backend-or-frontend-deployment> -n <namespace>
```

## 7. Tester l’accès local

- Vérifier que le backend répond sur son endpoint de santé.
- Vérifier que le frontend est accessible depuis la machine hôte.
- Vérifier que le frontend peut joindre le backend via le service Kubernetes.

## 8. Corriger si nécessaire

- Revoir les probes si les pods redémarrent trop tôt.
- Revoir les variables d’environnement si la connexion à MySQL échoue.
- Revoir les services si le frontend ne atteint pas le backend.
