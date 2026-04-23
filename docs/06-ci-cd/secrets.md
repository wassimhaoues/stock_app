# Secrets GitHub requis

Les secrets sont configurés dans : **GitHub → dépôt → Settings → Secrets and variables → Actions → Repository secrets**

## Liste des secrets

| Secret | Workflow | Obligatoire | Description |
|--------|----------|-------------|-------------|
| `SONAR_TOKEN` | `ci.yml` | Oui | Token d'authentification SonarCloud |
| `JWT_SECRET` | `ci.yml` | Oui | Clé JWT pour les tests d'intégration backend |
| `SSH_PRIVATE_KEY` | `cd.yml` | Oui | Clé privée SSH pour pousser le commit GitOps |
| `NVD_API_KEY` | `security.yml` | Non | Accélère OWASP Dependency-Check (optionnel) |

## Configurer SONAR_TOKEN

1. Se connecter sur https://sonarcloud.io
2. Mon profil → Security → Generate Token
3. Copier le token
4. GitHub → Settings → Secrets → New secret : `SONAR_TOKEN`

L'organisation SonarCloud (`wassimhaoues`) et le projet (`wassimhaoues_stock_app`) sont configurés dans `sonar-project.properties`.

## Configurer JWT_SECRET

La valeur peut être n'importe quelle chaîne Base64 d'au moins 32 caractères. Générer :

```bash
openssl rand -base64 32
```

GitHub → Settings → Secrets → New secret : `JWT_SECRET`

## Configurer SSH_PRIVATE_KEY (deploy key)

Cette clé permet au pipeline CD de pousser le commit GitOps sur la branche `main` protégée.

### Générer la paire de clés

```bash
ssh-keygen -t ed25519 -C "stockpro-cd-deploy" -f ~/.ssh/stockpro_deploy -N ""
```

Cela crée :
- `~/.ssh/stockpro_deploy` — clé privée
- `~/.ssh/stockpro_deploy.pub` — clé publique

### Ajouter la clé publique comme Deploy Key

1. GitHub → dépôt → Settings → Deploy keys → Add deploy key
2. Titre : `CD GitOps Deploy Key`
3. Coller le contenu de `~/.ssh/stockpro_deploy.pub`
4. Cocher **Allow write access**
5. Cliquer **Add key**

### Ajouter la clé privée comme Secret GitHub

1. GitHub → dépôt → Settings → Secrets → New secret
2. Nom : `SSH_PRIVATE_KEY`
3. Valeur : contenu complet de `~/.ssh/stockpro_deploy` (incluant `-----BEGIN...` et `-----END...`)

### Configurer le ruleset pour bypasser la protection de branche

La branche `main` est protégée. La deploy key doit être autorisée à bypasser cette protection :

1. GitHub → dépôt → Settings → Rules → Rulesets
2. Sélectionner ou créer un ruleset pour `main`
3. Dans "Bypass list" → Add bypass → **Deploy keys**
4. Sauvegarder

### Vérifier la configuration

Après un merge sur `main`, le workflow CD doit :
1. Détecter les changements (backend et/ou frontend)
2. Builder et pousser les images vers GHCR
3. Créer un commit `chore(gitops): bump images to sha-XXXXXXX [skip ci]` sur `main`

## Configurer NVD_API_KEY (optionnel)

Améliore la vitesse de téléchargement de la base de données NVD pour OWASP Dependency-Check.

1. S'inscrire sur https://nvd.nist.gov/developers/request-an-api-key
2. GitHub → Settings → Secrets → New secret : `NVD_API_KEY`

Sans cette clé, OWASP Dependency-Check fonctionne mais est plus lent (téléchargement sans authentification limité en débit).
