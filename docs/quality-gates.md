# Qualité logicielle et sécurité de pipeline — Phase 15

Ce document décrit les contrôles de qualité et de sécurité ajoutés au pipeline CI dans la Phase 15, leur rôle, leurs seuils de blocage et la façon d'interpréter leurs rapports.

---

## Vue d'ensemble du pipeline

Le pipeline CI StockPro est composé de deux workflows GitHub Actions :

| Workflow | Fichier | Déclencheurs |
|---|---|---|
| CI principal | `.github/workflows/ci.yml` | Push sur toutes branches `feature/**`, `dev`, `main` + PR vers `dev`/`main` |
| Sécurité | `.github/workflows/security.yml` | Push/PR vers `dev` et `main` + planification hebdomadaire |

---

## Contrôles CI principal (`ci.yml`)

### Jobs Phase 14 (inchangés)

- **Backend** — `mvn test` + `mvn package`
- **Frontend** — format check + tests Vitest + `ng build`

### Ajouts Phase 15

#### Audit npm des dépendances de production

```
npm audit --audit-level=high --omit=dev
```

- Analyse uniquement les dépendances de production (`dependencies`, pas `devDependencies`).
- Bloque si une vulnérabilité de sévérité **High** ou **Critical** est détectée.
- Exécuté avant le build, dans le job `frontend`.

#### SonarCloud — Quality Gate (job `sonarcloud`)

- S'exécute après les jobs `backend` et `frontend`.
- Lance `mvn verify` pour générer le rapport de couverture JaCoCo (`target/site/jacoco/jacoco.xml`).
- Lance le scanner SonarCloud sur le backend Java et le frontend Angular.
- Le pipeline **bloque** si le Quality Gate SonarCloud échoue (`sonar.qualitygate.wait=true`).

**Seuils Quality Gate par défaut SonarCloud :**

| Métrique | Seuil de blocage |
|---|---|
| Nouveaux bugs | 0 |
| Nouvelles vulnérabilités | 0 |
| Nouvelles Security Hotspots non examinées | 0 % |
| Couverture sur nouveau code | ≥ 80 % |
| Duplications sur nouveau code | ≤ 3 % |
| Nouveaux Code Smells bloquants | 0 |

---

## Contrôles sécurité (`security.yml`)

### CodeQL — SAST

- Analyse statique des sources Java (backend) et TypeScript (frontend).
- Utilise la query suite `security-extended` pour détecter les failles OWASP courantes (injection, XSS, broken auth…).
- Les résultats apparaissent dans l'onglet **Security → Code scanning alerts** du dépôt GitHub.
- Exécuté sur push/PR vers `dev`/`main` et chaque lundi à 03h00 UTC.

**Failles détectables côté Java :** injections SQL, path traversal, deserialisation non sécurisée, secrets en dur, mauvaise gestion des erreurs.

**Failles détectables côté TypeScript :** XSS, eval dynamique, URL injection, stockage non sécurisé de données sensibles.

### OWASP Dependency-Check — backend Maven

- Analyse les dépendances Maven listées dans `backend/pom.xml` contre la base NVD (National Vulnerability Database).
- Bloque si une CVE de score CVSS ≥ 9 (critique) est détectée dans une dépendance.
- Le rapport HTML est archivé dans les **Artifacts** GitHub Actions (`dependency-check-report`) pendant 30 jours.
- La base NVD est mise en cache entre les exécutions pour éviter un téléchargement complet à chaque run.

**Variables GitHub Secrets requises :**

| Secret | Rôle |
|---|---|
| `NVD_API_KEY` | Clé API NVD pour accélérer la synchronisation de la base CVE. Optionnel — sans elle le scan reste fonctionnel mais plus lent. |

Pour obtenir une clé NVD API gratuite : [https://nvd.nist.gov/developers/request-an-api-key](https://nvd.nist.gov/developers/request-an-api-key)

### Trivy — scan des images Docker

- Construit les images Docker `backend` et `frontend` directement dans le runner CI.
- Scanne les couches OS et les bibliothèques applicatives.
- N'alerte que sur les vulnérabilités **corrigées disponibles** (`ignore-unfixed: true`) pour éviter le bruit sur les CVE sans correctif.
- Bloque si une vulnérabilité **High** ou **Critical** avec un correctif disponible est détectée.
- Les résultats SARIF sont envoyés vers l'onglet **Security → Code scanning alerts** de GitHub.

---

## Secrets GitHub requis

| Secret | Utilisé par | Obligatoire |
|---|---|---|
| `SONAR_TOKEN` | SonarCloud Quality Gate | Oui |
| `JWT_SECRET` | Tests backend (contexte Spring) | Oui |
| `NVD_API_KEY` | OWASP Dependency-Check | Non (recommandé) |

Les variables `DB_NAME` et `DB_USERNAME` déjà configurées en Phase 14 ne sont pas nécessaires ici car les tests utilisent H2 en mémoire.

---

## Configuration SonarCloud

Le fichier `sonar-project.properties` à la racine du dépôt configure le projet SonarCloud :

```properties
sonar.organization=coworky
sonar.projectKey=coworky_stock-management
```

**À vérifier lors de la première connexion à SonarCloud :**
1. Créer un compte sur [https://sonarcloud.io](https://sonarcloud.io) avec le compte GitHub `Coworky`.
2. Importer le dépôt `stock-management`.
3. Vérifier que `sonar.organization` correspond au slug de l'organisation SonarCloud créée.
4. Vérifier que `sonar.projectKey` correspond à la clé affichée dans SonarCloud.
5. Générer un token dans SonarCloud et l'ajouter comme secret GitHub `SONAR_TOKEN`.

---

## Interprétation des rapports

### SonarCloud

- Accessible sur [https://sonarcloud.io](https://sonarcloud.io) → projet StockPro.
- L'onglet **Overview** affiche le statut du Quality Gate et les métriques clés.
- L'onglet **Issues** liste les bugs, vulnérabilités et code smells par sévérité.
- L'onglet **Security Hotspots** liste les zones à risque à examiner manuellement.
- Le badge de statut du Quality Gate est visible sur la PR GitHub.

### CodeQL

- Onglet **Security → Code scanning alerts** du dépôt GitHub.
- Chaque alerte indique la règle déclenchée, le fichier, la ligne et une explication.
- Les alertes peuvent être fermées comme **false positive** ou **won't fix** si justifiées.

### OWASP Dependency-Check

- Rapport HTML téléchargeable dans les **Artifacts** de chaque exécution GitHub Actions.
- Chaque dépendance vulnérable est listée avec sa CVE, son score CVSS et le correctif recommandé.
- Pour corriger : mettre à jour la version de la dépendance dans `backend/pom.xml`.

### Trivy

- Résultats SARIF dans l'onglet **Security → Code scanning alerts**.
- Chaque alerte indique la couche Docker concernée, le package vulnérable et la version corrigée.
- Pour corriger : mettre à jour l'image de base dans le `Dockerfile` ou la version du package.

---

## Règles de passage en vert

Un merge vers `dev` ou `main` est autorisé uniquement si :

1. Les jobs `backend` et `frontend` du CI passent (tests + build).
2. Le Quality Gate SonarCloud est **Passed**.
3. L'audit npm ne détecte aucune vulnérabilité High/Critical sur les dépendances de production.
4. Les scans CodeQL, OWASP et Trivy sont verts ou les alertes ont été examinées et justifiées.

Ces règles sont enforced par les **branch protection rules** GitHub configurées sur `dev` et `main`.
