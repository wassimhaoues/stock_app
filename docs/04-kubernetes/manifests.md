# Structure des manifests Kubernetes

## Arborescence

```
k8s/
├── base/
│   ├── namespace.yaml              Namespace "stockpro"
│   ├── kustomization.yaml          Kustomize : liste des ressources + ConfigMapGenerator
│   ├── assets/
│   │   └── 01-schema.sql           Schéma SQL chargé via ConfigMap dans MySQL
│   ├── backend/
│   │   ├── configmap.yaml          Variables non sensibles (DB_HOST, CORS, profil Spring)
│   │   ├── deployment.yaml         Deployment Spring Boot + initContainer + probes
│   │   └── service.yaml            Service ClusterIP port 8085
│   ├── frontend/
│   │   ├── deployment.yaml         Deployment nginx + Angular build
│   │   └── service.yaml            Service ClusterIP port 80
│   └── mysql/
│       ├── deployment.yaml         Deployment MySQL 8.0 + stratégie Recreate
│       ├── pvc.yaml                PersistentVolumeClaim 2Gi ReadWriteOnce
│       └── service.yaml            Service ClusterIP "stock-db" port 3306
├── overlays/
│   ├── local/
│   │   ├── kind-cluster.yaml       Configuration du cluster kind (NodePorts 30080/30085)
│   │   ├── kustomization.yaml      Overlay : secretGenerator + images locales + patch NodePort
│   │   ├── .env                    Secrets locaux (gitignore)
│   │   ├── .env.example            Template des secrets
│   │   └── patches/
│   │       └── expose-services.yaml  Patch NodePort pour accès depuis localhost
│   ├── gitops/
│   │   ├── kustomization.yaml      Overlay GitOps local : images GHCR + patch NodePort
│   │   └── patches/
│   │       └── expose-services.yaml  Patch NodePort pour ArgoCD local/kind
│   └── gke/
│       ├── kustomization.yaml      Overlay GKE : images GHCR + Ingress + certificat géré
│       ├── ingress.yaml            Ingress public GKE
│       ├── managed-certificate.yaml  Certificat TLS géré par GKE
│       └── patches/
│           └── backend-config-cors.yaml  CORS aligné sur le domaine public
└── argocd/
    ├── namespace.yaml              Namespace "argocd"
    ├── stockpro-app.yaml           Application ArgoCD locale pointant sur k8s/overlays/gitops
    └── stockpro-gke-app.yaml       Application ArgoCD GKE pointant sur k8s/overlays/gke
```

## Fichiers base clés

### `base/backend/configmap.yaml`

Contient les variables d'environnement non sensibles injectées dans le pod backend :

```yaml
data:
  SPRING_PROFILES_ACTIVE: docker
  DB_HOST: stock-db # Nom du service MySQL (résolution DNS interne K8s)
  DB_PORT: "3306"
  DB_NAME: stock_app_db
  SERVER_PORT: "8085"
  CORS_ALLOWED_ORIGINS: "http://localhost:30080"
```

### `base/backend/deployment.yaml`

Points importants :

- `initContainer` : attend que MySQL soit prêt sur `stock-db:3306` avant de démarrer
- `envFrom` : injecte le ConfigMap `backend-config`
- `env` : référence le Secret `stockpro-secrets` pour `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `STOCKPRO_DEMO_DATA`
- `readinessProbe` / `livenessProbe` : HTTP GET sur `/api/health`, délai initial 90s

### `base/mysql/service.yaml`

Le service MySQL est nommé `stock-db`. Ce nom correspond à la valeur `DB_HOST` dans le ConfigMap. Les pods backend s'y connectent via `stock-db:3306` (DNS K8s interne).

### `base/mysql/deployment.yaml`

- Stratégie `Recreate` (nécessaire avec un PVC `ReadWriteOnce` qui ne peut être monté que par un pod à la fois)
- Initialisation du schéma via le ConfigMap `mysql-init-sql` monté dans `/docker-entrypoint-initdb.d/`

## Différences entre overlays

| Aspect      | Overlay `local`                                       | Overlay `gitops`                                    | Overlay `gke`                                       |
| ----------- | ----------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------- |
| Secret      | `secretGenerator` depuis `.env` (automatique)         | Créé manuellement une seule fois                    | Créé manuellement une seule fois                    |
| Images      | `stockpro-backend:local` et `stockpro-frontend:local` | `ghcr.io/wassimhaoues/stockpro-backend:sha-XXXXXXX` | `ghcr.io/wassimhaoues/stockpro-backend:sha-XXXXXXX` |
| Tag d'image | `local`                                               | `sha-XXXXXXX` mis à jour par le pipeline CD         | `sha-XXXXXXX` mis à jour par le pipeline CD         |
| Exposition  | `NodePort` local                                      | `NodePort` local                                    | `Ingress` GKE                                       |
| Gestion     | Manuel (kubectl apply)                                | ArgoCD auto-sync local                              | ArgoCD auto-sync cloud                              |

## Ressources et limites

| Composant | CPU request | CPU limit | Mémoire request | Mémoire limit |
| --------- | ----------- | --------- | --------------- | ------------- |
| Backend   | 250m        | 500m      | 512Mi           | 1Gi           |
| Frontend  | 50m         | 100m      | 64Mi            | 128Mi         |
| MySQL     | 250m        | 500m      | 512Mi           | 1Gi           |

## Labels

Tous les pods utilisent des labels cohérents :

- `app: stockpro`
- `component: backend` / `frontend` / `mysql`
