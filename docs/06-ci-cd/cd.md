# Pipeline CD

Fichier : `.github/workflows/cd.yml`

## Déclencheur

```yaml
on:
  push:
    branches: [main]
```

Le CD ne tourne que sur `main`.

## Principe

Le workflow ne publie rien immédiatement. Il commence par attendre que les workflows `CI` et `Security` soient terminés avec succès sur le même commit.

Si l'un des deux échoue, le CD s'arrête.  
Si les deux sont verts, il peut :

1. détecter ce qui a changé ;
2. construire les images utiles ;
3. publier les images dans GHCR ;
4. ouvrir une PR GitOps pour mettre à jour les tags.

## Jobs

### `wait-for-main-validations`

Ce job interroge l'API GitHub Actions et attend explicitement :

- `CI`
- `Security`

Le but est simple : empêcher toute publication à partir d'un commit `main` non validé.

### `detect-changes`

Ce job compare `github.event.before` et `github.sha` pour savoir si `backend/` ou `frontend/` ont changé.

Sorties produites :

- `backend=true|false`
- `frontend=true|false`
- `tag=sha-XXXXXXX`

## Builds sélectifs

### `build-backend`

Ce job ne s'exécute que si des fichiers du dossier `backend/` ont changé.

Étapes principales :

- checkout du commit courant ;
- authentification à GHCR ;
- configuration de Buildx ;
- build et push de l'image backend.

Image publiée :

```text
ghcr.io/wassimhaoues/stockpro-backend:sha-XXXXXXX
```

### `build-frontend`

Même logique pour le frontend :

```text
ghcr.io/wassimhaoues/stockpro-frontend:sha-XXXXXXX
```

Si un seul des deux dossiers a changé, une seule image est reconstruite.

## Mise à jour GitOps

### `gitops-bump`

Ce job s'exécute si au moins une image a bien été publiée.

Il :

1. crée un token GitHub App ;
2. ouvre une branche `gitops/bump-images-sha-XXXXXXX` ;
3. met à jour `k8s/overlays/gitops/kustomization.yaml` ;
4. crée ou met à jour une PR GitOps ;
5. active l'auto-merge en squash.

Le workflow ne pousse donc pas directement dans `main`.

## Stratégie de tags

Les images sont taguées avec le SHA court du commit :

```text
sha-XXXXXXX
```

Ce choix permet :

- une version immuable ;
- une correspondance simple entre image et commit ;
- une mise à jour claire dans l'overlay GitOps.

Le tag `latest` n'est pas utilisé.

## Authentification utilisée

| Action | Mécanisme |
| --- | --- |
| Push des images GHCR | `GITHUB_TOKEN` avec `packages: write` |
| Push de la branche GitOps | token GitHub App |
| Création de la PR GitOps | token GitHub App |

## Cas à retenir

- Push direct sur `main` : `CI`, `Security` et `CD` démarrent, mais le CD reste bloqué tant que les deux validations ne sont pas vertes.
- PR contributeur vers `main` : le CD ne tourne qu'après le merge.
- PR GitOps : elle passe par ses checks légers dédiés, puis peut être fusionnée automatiquement.

## Protection anti-boucle

Le workflow ignore les commits `main` dont le message commence par :

```text
chore(gitops):
```

Cela évite de republier les images après le merge d'une PR GitOps.

## Résumé du flux

```text
merge sur main
    -> CI + Security
    -> attente explicite dans CD
    -> build sélectif backend/frontend
    -> push GHCR
    -> PR GitOps
    -> merge de la PR
    -> ArgoCD synchronise
```
