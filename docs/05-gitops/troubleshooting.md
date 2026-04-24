# Dépannage GitOps et ArgoCD

## L'application ArgoCD est en état "OutOfSync"

**Diagnostic :**

```bash
argocd app get stockpro
argocd app diff stockpro
```

**Causes fréquentes :**

| Cause                                        | Solution                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Nouveau commit sur `main` pas encore détecté | Attendre quelques secondes ou forcer : `argocd app sync stockpro`                                 |
| Modification manuelle dans le cluster        | ArgoCD corrige automatiquement avec `selfHeal: true`. Forcer : `argocd app sync stockpro --force` |
| Erreur de chemin dans le manifest ArgoCD     | Vérifier que `path: k8s/overlays/gitops` est correct                                              |

## Les pods ne démarrent pas après une sync

```bash
# Voir les événements du pod
kubectl describe pod <nom-du-pod> -n stockpro

# Voir les logs
kubectl logs <nom-du-pod> -n stockpro

# Voir les événements du namespace
kubectl get events -n stockpro --sort-by='.lastTimestamp'
```

**Causes fréquentes :**

| Symptôme                   | Cause probable                                          |
| -------------------------- | ------------------------------------------------------- |
| `ImagePullBackOff`         | Image GHCR non trouvée ou privée sans `imagePullSecret` |
| `CrashLoopBackOff` backend | Secret `stockpro-secrets` absent ou incomplet           |
| `Pending`                  | Ressources insuffisantes dans le cluster kind           |

## Erreur ImagePullBackOff (image GHCR privée)

Les images GHCR sont publiques après configuration. Si elles sont privées :

```bash
# Créer un imagePullSecret avec un PAT GitHub
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=wassimhaoues \
  --docker-password=<PAT_GITHUB> \
  -n stockpro
```

Puis ajouter `imagePullSecrets` dans les Deployments.

Pour rendre les packages GHCR publics : GitHub → profil → Packages → sélectionner le package → Settings → Change visibility → Public.

## Le Secret stockpro-secrets est absent

```bash
kubectl get secret stockpro-secrets -n stockpro
# Error from server (NotFound): secrets "stockpro-secrets" not found
```

Solution : suivre la procédure de [bootstrap.md](bootstrap.md).

## Le pipeline CD boucle à l'infini

**Symptôme :** le workflow CD republie alors qu'une PR GitOps vient d'être mergee.

**Protection en place :**

1. le merge de la PR GitOps doit se faire en `squash`
2. le commit final sur `main` doit commencer par `chore(gitops): bump images to sha-XXXXXXX`
3. le job `wait-for-main-validations` de `cd.yml` ignore ces commits GitOps sur `main`

Si la boucle se produit quand même :

- verifier que l'auto-merge GitHub est bien configure en squash pour la PR GitOps
- verifier que le commit final sur `main` commence bien par `chore(gitops):`
- verifier qu'aucun contournement manuel n'a pousse directement `k8s/overlays/gitops/kustomization.yaml` sur `main`

## La PR GitOps n'est pas créée

Verifier :

1. que le job `gitops-bump` a les permissions `contents: write` et `pull-requests: write`
2. que `Settings → Actions → General → Workflow permissions` est en `Read and write permissions`
3. que le workflow a bien publie au moins une image backend ou frontend

Si aucun code applicatif n'a change dans `backend/` ou `frontend/`, le job GitOps est normalement ignore.

## La PR GitOps est créée mais l'auto-merge ne s'active pas

Verifier :

1. que l'auto-merge est active au niveau du depot GitHub
2. que les checks requis du ruleset sont bien ceux attendus pour ce type de PR
3. que `github-actions[bot]` n'est pas bloque par la politique du depot

Dans ce cas, la PR GitOps reste ouverte jusqu'a correction de la configuration ou merge manuel.

## Rollback à une version précédente

**Via ArgoCD CLI :**

```bash
# Voir l'historique des déploiements
argocd app history stockpro

# Rollback à une révision spécifique
argocd app rollback stockpro <revision_id>
```

**Via Git (recommandé) :**

1. Éditer `k8s/overlays/gitops/kustomization.yaml`
2. Remplacer `newTag` par l'ancien SHA souhaité
3. Ouvrir une PR vers `main`
4. Merger la PR
5. ArgoCD détecte le changement et resynchronise automatiquement

## ArgoCD ne détecte pas les changements Git

ArgoCD vérifie le dépôt toutes les 3 minutes par défaut.

```bash
# Forcer une vérification immédiate
argocd app sync stockpro

# ou via l'UI : bouton "Refresh" puis "Sync"
```

## Vérifier quelle version est déployée

```bash
# Voir le tag d'image actuel dans le cluster
kubectl get deployment stock-backend -n stockpro \
  -o jsonpath='{.spec.template.spec.containers[0].image}'

# Comparer avec le kustomization.yaml
grep newTag k8s/overlays/gitops/kustomization.yaml
```
