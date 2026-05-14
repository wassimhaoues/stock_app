# Phase 24 — Préparation GCP, GKE, Ingress et GitOps cloud

Ce guide prépare une extension cloud du projet sans casser le flux actuel basé sur `kind`.

## Objectif visé

À la fin de la phase 24, le fonctionnement attendu est le suivant :

```text
push sur main
    -> CI + Security
    -> build des images
    -> push dans GHCR
    -> PR GitOps
    -> merge sur main
    -> ArgoCD sur GKE détecte les nouveaux tags et synchronise
    -> ArgoCD local sur kind synchronise aussi si le cluster local est démarré
```

Pour atteindre ce résultat sans casser l'existant, la cible documentaire est :

- garder `k8s/overlays/local/` pour le développement `kind` classique ;
- conserver `k8s/overlays/gitops/` comme cible GitOps locale `kind` ;
- ajouter un overlay GKE dédié avec `Ingress` ;
- créer une application ArgoCD par cible.

## Architecture cible recommandée

### Overlays

Structure recommandée après implémentation :

```text
k8s/overlays/
├── local/              -> développement manuel sur kind avec images :local
├── gitops/             -> kind piloté par ArgoCD, images GHCR, exposition locale
└── gke/                -> GKE piloté par ArgoCD, images GHCR, Ingress
```

### Applications ArgoCD

- `stockpro` pointe vers `k8s/overlays/gitops`
- `stockpro-gke` pointe vers `k8s/overlays/gke`

Ce découpage permet :

- de ne pas casser le flux local historique ;
- d'exposer GKE proprement avec `Ingress` ;
- de mettre à jour plusieurs cibles à partir de la même PR GitOps ;
- de laisser `kind` optionnel : si le cluster local n'existe pas, GKE continue seul.

## Avant de commencer

Pré-requis locaux :

- `gcloud` déjà installé ;
- `kubectl` installé ;
- `argocd` CLI installé ;
- accès à votre compte Google Cloud ;
- droits suffisants pour créer ou utiliser le projet GCP `Stock-management`.

Important :

- le nom affiché du projet peut être `Stock-management`, mais les commandes `gcloud` utilisent surtout le `PROJECT_ID` ;
- GHCR reste le registre d'images du projet, donc `Artifact Registry` n'est pas requis pour cette phase ;
- un `Ingress` GKE peut entraîner un coût supplémentaire via le load balancer externe.

## Cloud DNS ou DNS externe

`Cloud DNS` est le service DNS hébergé de Google Cloud. Il sert à gérer des zones DNS et des enregistrements DNS directement dans GCP.

Dans ce projet, `Cloud DNS` n'est pas obligatoire.

Si votre domaine est déjà géré chez `o2switch`, le scénario le plus simple est :

- réserver une IP globale côté GCP pour l'Ingress GKE ;
- créer plus tard un sous-domaine `stockpro.coworky.org` dans `o2switch` ;
- pointer ce sous-domaine vers l'IP globale GKE avec un enregistrement `A`.

Conclusion pratique :

- si vous gardez `o2switch` comme gestionnaire DNS, vous pouvez ignorer `Cloud DNS` ;
- `Cloud DNS` ne devient utile que si vous voulez aussi héberger la zone DNS dans Google Cloud.

## 1. Relier `gcloud` au bon projet

### 1.1 Se connecter avec votre compte Google

```bash
gcloud auth login
```

Si vous utilisez plusieurs contextes, créez une configuration dédiée :

```bash
gcloud config configurations create stock-management
gcloud config configurations activate stock-management
gcloud auth login
```

### 1.2 Retrouver le vrai `PROJECT_ID`

Le projet s'appelle `Stock-management`, mais il faut retrouver son identifiant réel :

```bash
gcloud projects list --filter="name:Stock-management"
```

Repérez la colonne `PROJECT_ID`, puis exportez-la :

```bash
export PROJECT_ID="<project-id-reel>"
gcloud config set project "${PROJECT_ID}"
```

Vérification :

```bash
gcloud config get-value project
```

### 1.3 Corriger l'avertissement sur le quota project ADC

Si `gcloud config set project "${PROJECT_ID}"` affiche un message comme :

```text
WARNING: Your active project does not match the quota project in your local
Application Default Credentials file.
```

cela veut simplement dire que vos `Application Default Credentials` locales pointent encore vers un autre projet Google Cloud.

Dans un poste qui a déjà servi avec plusieurs projets, c'est courant.

Commande recommandée :

```bash
gcloud auth application-default set-quota-project "${PROJECT_ID}"
```

Vous pouvez aussi vérifier ou recréer vos credentials applicatifs locaux si nécessaire :

```bash
gcloud auth application-default login
gcloud auth application-default set-quota-project "${PROJECT_ID}"
```

Ce réglage est surtout utile pour les outils qui utilisent les `Application Default Credentials` au lieu de la session `gcloud` classique.

Pour la phase 24, la bonne pratique est :

- `gcloud config set project "${PROJECT_ID}"` pour votre contexte CLI ;
- `gcloud auth application-default set-quota-project "${PROJECT_ID}"` pour éviter les problèmes de quota ou de facturation inattendus.

## 2. Activer les APIs minimales

Pour ce scénario GKE + Ingress, activez au minimum :

```bash
gcloud services enable \
  container.googleapis.com \
  compute.googleapis.com \
  serviceusage.googleapis.com \
  --project "${PROJECT_ID}"
```

Rôle de chaque API :

- `container.googleapis.com` : GKE
- `compute.googleapis.com` : load balancer, IP statique, firewall gérés par GKE
- `serviceusage.googleapis.com` : gestion des APIs

API optionnelle :

```bash
gcloud services enable dns.googleapis.com --project "${PROJECT_ID}"
```

- `dns.googleapis.com` : utile uniquement si vous décidez plus tard d'utiliser `Cloud DNS`

## 3. Choisir une région et une zone simples

Pour une démonstration peu coûteuse, utilisez une seule zone et un seul nœud.

Exemple :

```bash
export REGION="europe-west1"
export ZONE="europe-west1-b"
export CLUSTER_NAME="stockpro-gke"
```

Adaptez la zone selon vos quotas disponibles.

## 4. Créer un cluster GKE Standard minimal

Ce guide recommande un cluster `Standard` à un seul nœud pour garder la main sur la taille de la VM.

Commande proposée :

```bash
gcloud container clusters create "${CLUSTER_NAME}" \
  --project "${PROJECT_ID}" \
  --zone "${ZONE}" \
  --machine-type "e2-small" \
  --num-nodes "1" \
  --disk-type "pd-standard" \
  --disk-size "30" \
  --release-channel "regular" \
  --enable-ip-alias \
  --addons HttpLoadBalancing
```

Notes :

- `e2-small` vise un coût bas pour une démo ; si votre quota ou la disponibilité bloque, essayez `e2-medium`.
- `HttpLoadBalancing` est nécessaire pour l'Ingress GKE classique.
- un seul nœud convient pour une démonstration, pas pour de la haute disponibilité.

## 5. Récupérer les credentials Kubernetes

```bash
gcloud container clusters get-credentials "${CLUSTER_NAME}" \
  --zone "${ZONE}" \
  --project "${PROJECT_ID}"
```

Vérifications :

```bash
kubectl config current-context
kubectl get nodes
```

## 6. Préparer le namespace applicatif et les secrets

Créer le namespace applicatif :

```bash
kubectl create namespace stockpro --dry-run=client -o yaml | kubectl apply -f -
```

Créer le secret bootstrap depuis votre `.env` local :

```bash
kubectl create secret generic stockpro-secrets \
  --from-env-file=.env \
  -n stockpro \
  --dry-run=client -o yaml | kubectl apply -f -
```

Ce secret reste nécessaire tant que l'overlay GitOps cloud ne s'appuie pas sur un gestionnaire de secrets externe.

## 7. Installer ArgoCD dans GKE

### 7.1 Installer ArgoCD

```bash
kubectl apply -f k8s/argocd/namespace.yaml

kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

Attendre le démarrage :

```bash
kubectl get pods -n argocd -w
```

### 7.2 Accès initial

Récupérer le mot de passe admin :

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
echo
```

Créer un tunnel local temporaire :

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Si le `port-forward` vers le `Service` coupe ou devient instable, utilisez plutôt le pod ou le deployment :

```bash
kubectl port-forward deployment/argocd-server -n argocd 8080:8080
```

Important :

- `argocd-server` est en `ClusterIP` juste après l'installation ;
- l'adresse vue dans `kubectl get svc`, par exemple `34.x.x.x`, est une IP interne de service Kubernetes, pas une IP publique de navigateur ;
- il ne faut donc pas essayer `https://34.x.x.x:8080` depuis votre machine ;
- tant qu'aucun `LoadBalancer` ou `Ingress` n'expose ArgoCD, l'accès se fait par `port-forward`.

Test rapide conseillé avant d'ouvrir le navigateur :

```bash
curl -kI https://localhost:8080
```

Puis ouvrir :

```text
https://localhost:8080
```

Le certificat est auto-signé au départ, donc l'avertissement navigateur est normal.

### 7.3 Fallback si le port-forward est instable sur GKE

Sur certains environnements, le `port-forward` Kubernetes peut être instable même si `argocd-server` fonctionne correctement.

Dans ce cas, vous pouvez exposer temporairement ArgoCD via un `LoadBalancer` GKE.

Commande :

```bash
kubectl patch svc argocd-server -n argocd \
  -p '{"spec":{"type":"LoadBalancer"}}'
```

Puis vérifier l'adresse publique :

```bash
kubectl get svc argocd-server -n argocd -w
```

Quand `EXTERNAL-IP` est renseignée, ouvrir :

```text
https://<EXTERNAL-IP>
```

Remarques :

- l'avertissement TLS reste normal au départ ;
- cette exposition est pratique pour l'administration ponctuelle ;
- une fois terminé, vous pouvez remettre le service en `ClusterIP` si vous voulez réduire la surface exposée.

Retour en `ClusterIP` :

```bash
kubectl patch svc argocd-server -n argocd \
  -p '{"spec":{"type":"ClusterIP"}}'
```

Connexion CLI :

```bash
argocd login localhost:8080 --username admin --password "<mot_de_passe>" --insecure
```

Si la CLI fonctionne mais que l'interface web reste bloquée après le login :

- considérez que le serveur ArgoCD fonctionne quand même ;
- le blocage vient souvent du `port-forward` local, plus fragile pour l'UI que pour la CLI ;
- dans ce cas, utilisez soit la CLI pour continuer, soit le fallback `LoadBalancer` décrit juste au-dessus.

## 8. Préparer l'exposition GKE avec `Ingress`

### 8.1 Réserver une IP publique statique

Une IP statique évite de changer d'adresse à chaque recréation d'Ingress.

```bash
export GKE_STATIC_IP_NAME="stockpro-gke-ip"

gcloud compute addresses create "${GKE_STATIC_IP_NAME}" \
  --global \
  --project "${PROJECT_ID}"
```

Afficher l'IP :

```bash
gcloud compute addresses describe "${GKE_STATIC_IP_NAME}" \
  --global \
  --project "${PROJECT_ID}" \
  --format="value(address)"
```

Cette IP globale est la valeur à réutiliser plus tard dans votre DNS externe.

### 8.2 DNS

Si vous gardez `o2switch` comme gestionnaire DNS :

- créez plus tard un enregistrement `A` pour `stockpro.coworky.org` vers cette IP ;
- attendez la propagation avant d'activer HTTPS géré.

Exemple attendu :

```text
stockpro.coworky.org.   A   <IP_GLOBALE_GKE>
```

Si vous n'avez pas encore créé le sous-domaine :

- vous pouvez commencer par tester l'Ingress en HTTP avec l'IP publique ;
- la partie certificat managé peut venir ensuite.

Si un jour vous déplacez la zone DNS dans Google Cloud, vous pourrez remplacer cette gestion `o2switch` par `Cloud DNS`, mais ce n'est pas nécessaire pour la phase 24.

### 8.3 HTTPS plus tard

Le dépôt est déjà prêt pour HTTPS plus tard :

- l'Ingress GKE référence une IP globale statique ;
- le manifest [k8s/overlays/gke/managed-certificate.yaml](../../../k8s/overlays/gke/managed-certificate.yaml) déclare le domaine `stockpro.coworky.org` ;
- l'Ingress référence ce certificat géré.

Ordre recommandé :

1. réserver l'IP globale ;
2. déployer l'overlay GKE ;
3. créer l'enregistrement DNS `A` dans `o2switch` vers cette IP ;
4. attendre la propagation DNS ;
5. laisser GKE provisionner automatiquement le certificat managé ;
6. utiliser ensuite `https://stockpro.coworky.org`.

Important :

- tant que le DNS ne pointe pas vers l'Ingress GKE, le certificat managé peut rester en attente ;
- au début, un test en HTTP sur l'IP publique est acceptable ;
- HTTPS devient la cible finale une fois le sous-domaine actif.

### 8.4 Choix d'implémentation recommandé

Pour ce projet, le plus simple sur GKE est :

- un service frontend en `ClusterIP` ;
- un service backend en `ClusterIP` ;
- un objet `Ingress` GKE en frontal ;
- une éventuelle `ManagedCertificate` plus tard si vous avez un domaine.

Ne gardez pas le patch `NodePort` du flux local pour GKE.

### 8.5 Cas cible pour ce projet

Le scénario cible retenu est :

- domaine géré chez `o2switch` ;
- sous-domaine futur : `stockpro.coworky.org` ;
- IP globale statique réservée dans GCP ;
- enregistrement `A` créé côté `o2switch` ;
- `Ingress` GKE utilisant cette IP ;
- certificat managé GKE activable plus tard quand le DNS pointera correctement vers l'Ingress.

## 9. Cible GitOps à implémenter dans le dépôt

Le dépôt devra évoluer vers ce modèle :

### 9.1 Overlay `local`

Il reste inchangé :

- build local ;
- tags `:local` ;
- `kind load docker-image` ;
- `kubectl apply -k k8s/overlays/local`.

### 9.2 Overlay `gitops`

But :

- réutiliser GHCR et des tags `sha-*` ;
- permettre à ArgoCD local de suivre le même flux GitOps que GKE ;
- garder une exposition locale compatible avec `kind`.

### 9.3 Overlay `gke`

But :

- images GHCR ;
- pas de `NodePort` ;
- objets `Ingress` et éventuellement certificat managé ;
- configuration backend adaptée au domaine GKE si nécessaire.

### 9.4 Pipeline CD

Le workflow `.github/workflows/cd.yml` devra être ajusté pour :

- mettre à jour les tags dans `k8s/overlays/gitops/kustomization.yaml` ;
- mettre à jour les tags dans `k8s/overlays/gke/kustomization.yaml` ;
- garder une seule PR GitOps pour tous les overlays cibles.

## 10. Applications ArgoCD à prévoir

### 10.1 Dans GKE

Application recommandée :

- nom : `stockpro-gke`
- source : `k8s/overlays/gke`
- destination : cluster GKE courant, namespace `stockpro`

### 10.2 En local sur `kind`

Application recommandée :

- nom : `stockpro`
- source : `k8s/overlays/gitops`
- destination : cluster `kind` courant, namespace `stockpro`

Important :

- cette application locale est optionnelle ;
- si le cluster `kind` n'est pas démarré, GKE continue de fonctionner normalement ;
- le dépôt Git reste la source de vérité unique.

## 11. Vérification finale attendue

Quand la phase 24 sera implémentée, le test de démonstration attendu sera :

1. pousser une modification applicative sur GitHub ;
2. laisser `CI` et `Security` valider le commit ;
3. laisser le `CD` publier les images dans GHCR ;
4. laisser la PR GitOps modifier les tags des overlays cloud et local GitOps ;
5. constater qu'ArgoCD sur GKE applique les nouvelles images ;
6. constater qu'ArgoCD local applique aussi les nouvelles images si `kind` est lancé.

## 12. Limites acceptées pour la démonstration

- un seul nœud GKE ;
- MySQL en pod unique avec PVC ;
- pas de haute disponibilité ;
- coût minimal privilégié à la robustesse ;
- domaine et certificat HTTPS optionnels au tout début, mais `Ingress` prêt dès la phase 24.

## 13. Références vérifiées

Les commandes et choix de ce guide ont été alignés avec la documentation Google Cloud et GKE consultée le 14 mai 2026, notamment pour :

- `gcloud container clusters create`
- authentification `gcloud` vers GKE
- `Ingress` GKE avec load balancer HTTP(S)
- IP statique globale
- certificats managés GKE
