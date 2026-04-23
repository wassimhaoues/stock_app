# Prérequis

## Développement local (sans Docker)

| Outil | Version minimale | Vérification | Installation |
|-------|-----------------|--------------|--------------|
| Git | 2.x | `git --version` | https://git-scm.com |
| Java (JDK) | 17 | `java -version` | https://adoptium.net |
| Maven | 3.8+ | `./mvnw -version` (wrapper inclus) | inclus via `mvnw` |
| Node.js | 20 LTS | `node -v` | https://nodejs.org |
| npm | 9+ | `npm -v` | inclus avec Node.js |
| MySQL | 8.0 | `mysql --version` | https://dev.mysql.com/downloads/ |

> Maven n'a pas besoin d'être installé globalement. Le wrapper `./mvnw` dans `backend/` télécharge automatiquement la bonne version.

## Docker Compose (recommandé pour un premier lancement)

| Outil | Version minimale | Vérification |
|-------|-----------------|--------------|
| Docker Engine | 24+ | `docker --version` |
| Docker Compose | 2.x (plugin) | `docker compose version` |

Vérification rapide :

```bash
docker compose version
# Docker Compose version v2.x.x
```

> Ne pas confondre `docker-compose` (v1, binaire séparé, déprécié) et `docker compose` (v2, plugin intégré). Ce projet utilise la syntaxe v2.

## Kubernetes local (phases 16–18)

| Outil | Version | Vérification | Installation |
|-------|---------|--------------|--------------|
| kubectl | 1.29+ | `kubectl version --client` | https://kubernetes.io/docs/tasks/tools/ |
| kind | 0.22+ | `kind version` | https://kind.sigs.k8s.io/docs/user/quick-start/#installation |
| kustomize | 5.x | `kustomize version` | https://kubectl.docs.kubernetes.io/installation/kustomize/ |

## GitOps / ArgoCD (phase 17)

| Outil | Vérification |
|-------|--------------|
| ArgoCD CLI | `argocd version --client` |

Installation ArgoCD CLI :

```bash
# Linux / macOS
curl -sSL -o /usr/local/bin/argocd \
  https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x /usr/local/bin/argocd
```

## Vérification globale

```bash
git --version
java -version
node -v
npm -v
docker compose version
kubectl version --client
kind version
kustomize version
```

Toutes les commandes doivent retourner une version sans erreur avant de continuer.
