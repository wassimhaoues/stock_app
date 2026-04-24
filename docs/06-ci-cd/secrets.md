# Secrets GitHub requis

Les secrets sont configurés dans : **GitHub → dépôt → Settings → Secrets and variables → Actions → Repository secrets**

## Liste des secrets

| Secret        | Workflow       | Obligatoire | Description                                  |
| ------------- | -------------- | ----------- | -------------------------------------------- |
| `SONAR_TOKEN` | `ci.yml`       | Oui         | Token d'authentification SonarCloud          |
| `JWT_SECRET`  | `ci.yml`       | Oui         | Clé JWT pour les tests d'intégration backend |
| `NVD_API_KEY` | `security.yml` | Non         | Accélère OWASP Dependency-Check (optionnel)  |

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

## Permissions GitHub Actions pour la PR GitOps

Le workflow `cd.yml` n'utilise plus de deploy key SSH.
Il s'appuie sur `GITHUB_TOKEN` avec des permissions de job explicites :

```yaml
permissions:
  contents: write
  pull-requests: write
```

À vérifier côté dépôt :

1. GitHub → Settings → Actions → General
2. Dans **Workflow permissions**, choisir **Read and write permissions**
3. Activer l'auto-merge du dépôt si nécessaire
4. Vérifier que le ruleset / branch protection de `main` autorise le merge uniquement après les checks requis

### Vérifier la configuration

Après un merge applicatif sur `main`, le workflow CD doit :

1. Détecter les changements (backend et/ou frontend)
2. Builder et pousser les images vers GHCR
3. Créer une branche `gitops/bump-images-sha-XXXXXXX`
4. Ouvrir une PR `chore(gitops): bump images to sha-XXXXXXX`
5. Activer l'auto-merge GitHub sur cette PR

## Configurer NVD_API_KEY (optionnel)

Améliore la vitesse de téléchargement de la base de données NVD pour OWASP Dependency-Check.

1. S'inscrire sur https://nvd.nist.gov/developers/request-an-api-key
2. GitHub → Settings → Secrets → New secret : `NVD_API_KEY`

Sans cette clé, OWASP Dependency-Check fonctionne mais est plus lent (téléchargement sans authentification limité en débit).
