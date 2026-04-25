# Quality Gates

## Vue d'ensemble

| Contrôle                    | Workflow                | Seuil de blocage                                |
| --------------------------- | ----------------------- | ----------------------------------------------- |
| Tests backend               | `ci.yml`                | Tout test en échec bloque                       |
| Tests frontend              | `ci.yml`                | Tout test en échec bloque                       |
| Formatage Prettier          | `ci.yml`                | Tout écart bloque                               |
| Audit npm                   | `ci.yml`                | Vulnérabilité `high` ou `critical` bloque       |
| SonarCloud Quality Gate     | `ci.yml`                | Voir métriques ci-dessous                       |
| Validation YAML / manifests | `pr-validation.yml`     | Toute erreur de syntaxe bloque                  |
| Validation GitOps légère    | `gitops-validation.yml` | Toute erreur de rendu ou dry-run bloque         |
| CodeQL SAST                 | `security.yml`          | Résultat dans Security → Code scanning          |
| OWASP Dependency-Check      | `security.yml`          | CVSS ≥ 9 bloque                                 |
| Trivy images Docker         | `security.yml`          | `HIGH` ou `CRITICAL` avec fix disponible bloque |

## SonarCloud

### Métriques du Quality Gate

| Métrique                    | Seuil          |
| --------------------------- | -------------- |
| Bugs                        | 0 nouveaux     |
| Vulnérabilités              | 0 nouvelles    |
| Security Hotspots           | 0 non examinés |
| Coverage (nouveau code)     | ≥ 80%          |
| Duplications (nouveau code) | < 3%           |
| Maintenability Rating       | A              |

### Configuration

Le projet SonarCloud est configuré dans `sonar-project.properties` :

- **Backend :** analyse de `backend/src/main/java`, binaires depuis `target/classes`, couverture depuis `target/site/jacoco/jacoco.xml`
- **Frontend :** analyse de `frontend/src/app`, couverture depuis `coverage/stockpro-frontend/lcov.info`

### Exclusions de couverture

Les fichiers exclus du calcul de couverture (`sonar.coverage.exclusions`) :

- DTOs
- Entités JPA
- Repositories
- Classes de configuration
- `main.ts`
- Modèles TypeScript

### Accès

Dashboard SonarCloud : https://sonarcloud.io/project/overview?id=wassimhaoues_stock_app

## CodeQL (SAST)

Fichier : `.github/workflows/security.yml`

- **Langages :** Java/Kotlin et JavaScript/TypeScript
- **Requêtes :** `security-extended` (plus large que le défaut)
- **Résultats :** visibles dans Security → Code scanning alerts sur GitHub

CodeQL compile le backend avec Maven avant l'analyse pour une meilleure couverture.

## OWASP Dependency-Check (backend)

- Analyse les dépendances Maven du backend
- Bloque si une dépendance a un score CVSS ≥ 9
- La base NVD est mise en cache pour accélérer les exécutions
- Rapport HTML disponible comme artefact GitHub Actions (30 jours de rétention)

Optionnel : configurer le secret `NVD_API_KEY` pour accélérer le téléchargement de la base NVD.

## Trivy (scan d'images Docker)

- Build les images backend et frontend sans les pousser
- Analyse les vulnérabilités `HIGH` et `CRITICAL` uniquement
- Ignore les CVE sans fix disponible (`--ignore-unfixed`)
- Résultats au format SARIF uploadés dans Security → Code scanning

## Audit npm (frontend)

La CI exécute `npm audit --audit-level=high` qui bloque si une dépendance directe ou transitive a une vulnérabilité de niveau `high` ou `critical`.

## Pipeline "vert" : conditions complètes

Pour qu'une PR soit mergeable dans `main` :

1. Tous les tests backend passent (`./mvnw verify`)
2. Tous les tests frontend passent (`npm run test:coverage`)
3. Le build frontend est propre (`npm run build`)
4. Le format Prettier est respecté (`npm run format:check`)
5. Aucune dépendance npm à risque `high+` (`npm audit`)
6. Le Quality Gate SonarCloud valide les 6 métriques ci-dessus
7. La validation légère YAML / manifests passe
8. La CI est verte globalement

Les scans CodeQL, OWASP et Trivy tournent en parallèle dans `security.yml` et génèrent des alertes mais ne bloquent pas directement la PR (sauf configuration explicite des required checks).

## Séparation checks lourds vs légers en phase 22.4

### PR contributeur vers `main`

Checks exécutés :

- `CI`
- `Security`
- `PR Validation`

Auto-merge autorisé seulement si le ruleset / branch protection exige ces checks comme statuts requis.

### Push direct administrateur sur `main`

Checks exécutés :

- `CI`
- `Security`
- `CD` attend explicitement que `CI` et `Security` soient verts

Même en cas de bypass administrateur, le déploiement reste donc conditionné aux workflows verts.

### PR GitOps bot vers `main`

Checks exécutés :

- `GitOps Validation`

Auto-merge autorisé seulement si le ruleset / branch protection retient ce check léger pour les PR GitOps.

Checks explicitement ignorés :

- `CI`
- `Security`
- SonarCloud
- builds applicatifs backend/frontend
- scans CodeQL / OWASP / Trivy

## Auto-merge contrôlé en phase 22.2

Le comportement attendu pour une PR contributeur vers `main` est le suivant :

1. la PR s'ouvre
2. `CI`, `Security` et `PR Validation` s'exécutent
3. les checks obligatoires passent
4. GitHub auto-merge la PR si le ruleset et les permissions l'autorisent
5. le merge crée un nouveau push sur `main`
6. `CD` se déclenche ensuite uniquement sur ce code déjà validé

L'auto-merge doit rester gouverné par le ruleset / branch protection GitHub, pas par une logique de contournement implémentée dans les workflows.

Pour une PR GitOps bot, le comportement attendu est différent :

1. `cd.yml` ouvre une PR GitOps via la GitHub App
2. `GitOps Validation` s'exécute seule
3. si les checks légers passent, GitHub peut auto-merger la PR selon le ruleset
4. le commit squash sur `main` n'entraîne pas de rebuild applicatif complet

## Protection de branche significative en phase 22.5

Le modèle retenu est volontairement strict :

- `main` reste protégée par ruleset / branch protection
- les checks requis doivent être configurés pour les PR contributeurs
- les checks légers doivent être configurés pour les PR GitOps bot si le ruleset GitHub le permet
- l'absence d'écriture GitOps directe sur `main` reste une règle structurelle
- l'auto-merge est un accélérateur, jamais un contournement

La solution réellement retenue dans le dépôt est donc :

- push admin direct possible mais publication bloquée tant que `CI` et `Security` ne sont pas verts
- PR contributeur auto-mergeable seulement après ses checks requis
- PR GitOps bot auto-mergeable seulement après ses checks légers requis
- aucun cycle CD complet inutile après le merge d'une PR GitOps

Pour la configuration GitHub UI détaillée des checks requis, voir [docs/13-manual-work/phase-22-github-governance-setup.md](../13-manual-work/phase-22-github-governance-setup.md).

## Gouvernance `main` en phase 22.1

Pour qu'un commit déjà présent sur `main` puisse être livré par `cd.yml`, il faut maintenant deux validations explicites sur ce même SHA :

- `CI` doit finir avec `success`
- `Security` doit finir avec `success`

Conséquences :

- un push direct administrateur sur `main` ne peut pas publier tant que ces deux workflows ne sont pas verts
- un merge de PR vers `main` ne peut pas publier tant que ces deux workflows post-merge ne sont pas verts
- un commit GitOps merge avec `chore(gitops):` ne relance pas la chaîne
