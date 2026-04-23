# Quality Gates

## Vue d'ensemble

| Contrôle | Workflow | Seuil de blocage |
|----------|----------|-----------------|
| Tests backend | `ci.yml` | Tout test en échec bloque |
| Tests frontend | `ci.yml` | Tout test en échec bloque |
| Formatage Prettier | `ci.yml` | Tout écart bloque |
| Audit npm | `ci.yml` | Vulnérabilité `high` ou `critical` bloque |
| SonarCloud Quality Gate | `ci.yml` | Voir métriques ci-dessous |
| CodeQL SAST | `security.yml` | Résultat dans Security → Code scanning |
| OWASP Dependency-Check | `security.yml` | CVSS ≥ 9 bloque |
| Trivy images Docker | `security.yml` | `HIGH` ou `CRITICAL` avec fix disponible bloque |

## SonarCloud

### Métriques du Quality Gate

| Métrique | Seuil |
|----------|-------|
| Bugs | 0 nouveaux |
| Vulnérabilités | 0 nouvelles |
| Security Hotspots | 0 non examinés |
| Coverage (nouveau code) | ≥ 80% |
| Duplications (nouveau code) | < 3% |
| Maintenability Rating | A |

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
7. La CI est verte globalement

Les scans CodeQL, OWASP et Trivy tournent en parallèle dans `security.yml` et génèrent des alertes mais ne bloquent pas directement la PR (sauf configuration explicite des required checks).
