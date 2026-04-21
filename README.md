# StockPro

Application de gestion de stocks multi-entrepôts développée dans le cadre d'un projet universitaire JEE.

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Backend | Spring Boot 4.0.5, Java 17 |
| Frontend | Angular 21, Angular Material |
| Base de données | MySQL 8.0 |
| Authentification | JWT (Spring Security) |
| API Docs | Swagger / SpringDoc OpenAPI |
| Infrastructure | Docker + docker-compose |

## Prérequis

- Java 17+
- Maven 3.8+
- Node.js 20+ (recommandé : 24 via nvm)
- MySQL 8.0 (ou via Docker Compose dans `infra/`)

## Démarrage rapide

### 1. Base de données (via Docker)

```bash
cd infra
docker-compose up -d
```

Cela démarre MySQL sur le port `3307` et phpMyAdmin sur le port `8081`.

### 2. Backend

```bash
cd backend
mvn spring-boot:run
```

Le backend démarre sur `http://localhost:8085`.

- Swagger UI : `http://localhost:8085/swagger-ui.html`
- Health check : `http://localhost:8085/api/health`

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Le frontend démarre sur `http://localhost:4200`.

## Comptes de test

Trois comptes sont créés automatiquement au démarrage :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| ADMIN | admin@stockpro.local | Admin123! |
| GESTIONNAIRE | gestionnaire@stockpro.local | Gestion123! |
| OBSERVATEUR | observateur@stockpro.local | Observe123! |

## Rôles et permissions

| Module | ADMIN | GESTIONNAIRE | OBSERVATEUR |
|--------|-------|--------------|-------------|
| Utilisateurs | Gérer | — | — |
| Entrepôts | Gérer | Lecture (son entrepôt) | Lecture (son entrepôt) |
| Produits | Gérer | Lecture | Lecture |
| Stocks | Gérer | Gérer (son entrepôt) | Lecture (son entrepôt) |
| Mouvements | Gérer | Gérer (son entrepôt) | Lecture (son entrepôt) |
| Alertes | Consulter | Son entrepôt | Son entrepôt |
| Dashboard | Global | Son entrepôt | Son entrepôt |

## Tests

### Backend

```bash
cd backend
mvn test
```

### Frontend

```bash
cd frontend
npm test
```

### Vérification du format (frontend)

```bash
cd frontend
npm run format:check
```

## Structure du projet

```
stock-management/
├── backend/          # Spring Boot (Java 17)
├── frontend/         # Angular 21
├── infra/            # Docker Compose (MySQL + phpMyAdmin)
│   └── mysql-init/   # Schéma SQL initial
├── docs/             # Documentation
└── Project_plan.md   # Plan de développement par phases
```

## Variables d'environnement

Les variables configurables sont listées dans `infra/.env.example`.
Ne jamais committer le fichier `.env` contenant les vraies valeurs.

Les variables backend acceptent des overrides via les propriétés Spring :

| Variable | Défaut | Description |
|----------|--------|-------------|
| `DB_HOST` | 127.0.0.1 | Hôte MySQL |
| `DB_PORT` | 3307 | Port MySQL |
| `DB_NAME` | stock_app_db | Nom de la base |
| `DB_USERNAME` | Wassimhws | Utilisateur MySQL |
| `DB_PASSWORD` | — | Mot de passe MySQL |
| `JWT_SECRET` | clé de dev | Clé de signature JWT |
