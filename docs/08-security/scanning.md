# Scans de sécurité

Fichier workflow : `.github/workflows/security.yml`

## Vue d'ensemble

| Outil | Cible | Seuil de blocage |
|-------|-------|-----------------|
| CodeQL | Code source Java + TypeScript | Alertes dans Security tab |
| OWASP Dependency-Check | Dépendances Maven (backend) | CVSS ≥ 9 bloque le job |
| Trivy | Images Docker buildées | HIGH/CRITICAL avec fix bloque |
| npm audit | Dépendances npm (frontend) | `high` ou `critical` bloque la CI |

## CodeQL (Static Application Security Testing)

CodeQL analyse le code source pour détecter des patterns de vulnérabilités courantes.

**Configuration :**
- Langages : `java-kotlin` et `javascript-typescript`
- Suite de requêtes : `security-extended` (plus exhaustive que la suite par défaut)
- Le backend est compilé avec Maven avant l'analyse pour une meilleure précision

**Résultats :** GitHub → Security → Code scanning alerts

**Ce que CodeQL détecte :**
- Injections SQL
- Injection de commandes
- Failles XSS
- Mauvaise gestion des exceptions de sécurité
- Exposition de données sensibles dans les logs

## OWASP Dependency-Check

Analyse les dépendances Maven du backend contre la base de données NVD (National Vulnerability Database).

**Seuil de blocage :** CVSS ≥ 9.0

**Rapport :** artefact HTML téléchargeable depuis GitHub Actions (rétention 30 jours)

**Optimisation :** configurer le secret `NVD_API_KEY` pour accélérer le téléchargement de la base NVD. Sans cette clé, le téléchargement est soumis aux limites de débit de l'API NVD publique.

**Cache :** La base NVD est mise en cache dans GitHub Actions pour éviter un téléchargement complet à chaque exécution.

## Trivy (scan d'images Docker)

Trivy analyse les images Docker pour des vulnérabilités dans les couches de l'image.

**Comportement :**
- Les images sont buildées localement dans le runner GitHub Actions (pas poussées)
- Seules les sévérités `HIGH` et `CRITICAL` sont rapportées
- Les CVE sans fix disponible sont ignorées (`--ignore-unfixed`)
- Résultats au format SARIF uploadés vers GitHub Security

**Résultats :** GitHub → Security → Code scanning alerts (filtre : "Tool: Trivy")

## npm audit

`npm audit --audit-level=high` est exécuté dans le job `frontend` du pipeline CI.

**Seuil :** Bloque si une dépendance directe ou transitive a une vulnérabilité `high` ou `critical`.

En cas de blocage :

```bash
# Voir les vulnérabilités
npm audit

# Corriger automatiquement les versions compatibles
npm audit fix

# Forcer la correction (peut introduire des breaking changes)
npm audit fix --force
```

## Fréquence d'exécution

| Workflow | Déclenchement |
|----------|---------------|
| `ci.yml` (npm audit + SonarCloud) | Chaque push et PR |
| `security.yml` (CodeQL + OWASP + Trivy) | Push sur main/dev, PR vers main + schedule hebdomadaire |

Le schedule hebdomadaire permet de détecter les nouvelles CVE publiées entre deux commits.
