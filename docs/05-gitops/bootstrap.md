# Bootstrap du Secret Kubernetes

## Pourquoi un Secret bootstrap ?

L'overlay GitOps (`k8s/overlays/gitops`) ne contient **pas** de `secretGenerator`. Les secrets (mots de passe MySQL, clé JWT) ne doivent jamais être commités dans le dépôt Git.

Le Secret `stockpro-secrets` est créé **une seule fois manuellement** avant la première synchronisation ArgoCD. ArgoCD ne le modifie jamais lors des synchronisations suivantes.

## Créer le Secret

Depuis la racine du dépôt, avec le fichier `.env` rempli :

```bash
# Créer le namespace si absent
kubectl create namespace stockpro --dry-run=client -o yaml | kubectl apply -f -

# Créer le Secret depuis le fichier .env
kubectl create secret generic stockpro-secrets \
  --from-env-file=.env \
  -n stockpro

# Vérifier
kubectl get secret stockpro-secrets -n stockpro
kubectl describe secret stockpro-secrets -n stockpro
```

## Contenu attendu du Secret

Le Secret doit contenir au minimum :

| Clé | Description |
|-----|-------------|
| `MYSQL_ROOT_PASSWORD` | Mot de passe root MySQL |
| `MYSQL_DATABASE` | Nom de la base |
| `MYSQL_USER` | Utilisateur applicatif |
| `MYSQL_PASSWORD` | Mot de passe applicatif |
| `JWT_SECRET` | Clé de signature JWT |
| `STOCKPRO_DEMO_DATA` | `true` ou `false` |

## Vérification des valeurs

```bash
# Voir les clés (sans les valeurs)
kubectl get secret stockpro-secrets -n stockpro -o jsonpath='{.data}' | python3 -m json.tool

# Décoder une valeur spécifique
kubectl get secret stockpro-secrets -n stockpro \
  -o jsonpath='{.data.MYSQL_PASSWORD}' | base64 -d
echo
```

## Modifier le Secret après bootstrap

Si les valeurs doivent être modifiées :

```bash
# Mettre à jour le fichier .env avec les nouvelles valeurs
# Puis recréer le Secret
kubectl delete secret stockpro-secrets -n stockpro
kubectl create secret generic stockpro-secrets \
  --from-env-file=.env \
  -n stockpro

# Redémarrer les pods pour qu'ils prennent les nouvelles valeurs
kubectl rollout restart deployment/stock-backend -n stockpro
kubectl rollout restart deployment/stock-db -n stockpro
```

## Important

- Le fichier `.env` est dans `.gitignore`. Ne jamais le committer.
- Le Secret n'est pas géré par ArgoCD. Il persiste entre les synchronisations.
- Si le namespace est supprimé et recréé, le Secret doit être recréé manuellement.
