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

| Outil | Version minimale | Vérification |
|-------|-----------------|--------------|
| Git | 2.x | `git --version` |
| Java | 17 | `java -version` |
| Maven | 3.8 | `mvn -version` |
| Node.js | 20 (recommandé : 24 via nvm) | `node -v` |
| npm | 9 | `npm -v` |
| MySQL | 8.0 | via Docker ou installation native |

## Démarrage rapide

### 1. Base de données (via Docker)

```bash
cd infra
cp .env.example .env          # copier et adapter les valeurs si nécessaire
docker-compose up -d
```

Cela démarre MySQL sur le port `3307` et phpMyAdmin sur `http://localhost:8084`.

> **Note :** les valeurs par défaut de `application-dev.properties` correspondent aux
> identifiants de connexion documentés dans `infra/.env.example`. Si vous utilisez
> des identifiants différents, voir la section [Configuration locale](#configuration-locale).

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

## Stack conteneurisée (Docker)

Pour lancer l'intégralité de la stack (MySQL + backend + frontend) avec Docker Compose :

```bash
cp .env.example .env          # copier et renseigner les valeurs
docker-compose up --build -d
```

Cela construit les images et démarre trois services :

| Service | Rôle | Port hôte |
|---------|------|-----------|
| `stock-db` | MySQL 8.0 | *(interne)* |
| `stock-backend` | Spring Boot | `8085` |
| `stock-frontend` | nginx + Angular | `4200` |

Le frontend proxie automatiquement les appels `/api/` vers le backend via nginx.
Le backend et le frontend attendent que les services dont ils dépendent soient sains
avant de démarrer (healthchecks).

**Commandes utiles :**

```bash
docker-compose logs -f stock-backend   # suivre les logs du backend
docker-compose logs -f stock-frontend  # suivre les logs du frontend
docker-compose down                    # arrêter la stack
docker-compose down -v                 # arrêter et supprimer les volumes (réinitialise la BDD)
docker-compose up --build -d           # reconstruire et relancer
```

> **Note :** la base de données est persistée dans le volume nommé `stock_db_data`.
> Un `docker-compose down` seul conserve les données ; `docker-compose down -v` les efface.

## Vérification de bout en bout

Après les trois démarrages, vérifier dans l'ordre :

1. `http://localhost:8085/api/health` → `{"status":"UP"}`
2. `http://localhost:8085/swagger-ui.html` → Swagger charge
3. `http://localhost:4200` → Page de login s'affiche
4. Connexion avec `admin@stockpro.local` / `Admin123!` → Dashboard visible

## Configuration locale

### Valeurs par défaut (aucune configuration requise)

Le profil `dev` est actif par défaut. Les valeurs inscrites dans
`backend/src/main/resources/application-dev.properties` permettent de se connecter
directement à MySQL si les identifiants Docker n'ont pas été modifiés.

### Surcharge via variables d'environnement shell

Pour utiliser des identifiants différents, exporter les variables avant le lancement :

```bash
export DB_HOST=127.0.0.1
export DB_PORT=3307
export DB_NAME=stock_app_db
export DB_USERNAME=mon_utilisateur
export DB_PASSWORD=mon_mot_de_passe
export JWT_SECRET=ma_cle_jwt_base64_minimum_32_caracteres
export STOCKPRO_DEMO_DATA=true

cd backend && mvn spring-boot:run
```

### Surcharge via fichier de propriétés local (recommandé pour une config persistante)

Créer `backend/src/main/resources/application-local.properties` (exclu du dépôt par `.gitignore`) :

```properties
spring.datasource.username=mon_utilisateur
spring.datasource.password=mon_mot_de_passe
```

Activer le profil local en plus du profil dev :

```bash
cd backend
mvn spring-boot:run -Dspring.profiles.active=dev,local
```

### Surcharge via configuration IDE

Dans IntelliJ IDEA ou VS Code, définir les variables d'environnement dans la
configuration d'exécution (`Run/Debug Configuration > Environment variables`).

## MySQL sans Docker (installation native)

Si MySQL est installé nativement (port par défaut `3306`) :

```sql
-- Dans MySQL :
CREATE DATABASE stock_app_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'stockpro_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON stock_app_db.* TO 'stockpro_user'@'localhost';
FLUSH PRIVILEGES;
```

Puis exporter les variables pour pointer sur MySQL natif :

```bash
export DB_PORT=3306
export DB_USERNAME=stockpro_user
export DB_PASSWORD=votre_mot_de_passe
cd backend && mvn spring-boot:run
```

Hibernate crée les tables automatiquement au premier démarrage (`ddl-auto=update`).
Le schéma de référence est disponible dans `infra/mysql-init/01-schema.sql`.

## Données de démo

Par défaut (`STOCKPRO_DEMO_DATA=true`), le backend charge au démarrage un jeu de données complet :
4 entrepôts tunisiens, ~10 produits réels (informatique, gaming, téléphonie, TV, photo, son), des stocks et des mouvements.

Pour démarrer avec une base vide (compte admin seul) :

```bash
export STOCKPRO_DEMO_DATA=false
cd backend && mvn spring-boot:run
```

## Comptes de test

Trois comptes sont créés automatiquement au démarrage :

| Rôle | Nom | Email | Mot de passe |
|------|-----|-------|--------------|
| ADMIN | Wassim Haoues | admin@stockpro.local | Admin123! |
| GESTIONNAIRE | Youssef Trabelsi | gestionnaire@stockpro.local | Gestion123! |
| OBSERVATEUR | Ines Mansouri | observateur@stockpro.local | Observe123! |

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
├── backend/              # Spring Boot (Java 17)
│   ├── Dockerfile        # Image backend (multi-stage Maven + JRE)
│   └── .dockerignore
├── frontend/             # Angular 21
│   ├── Dockerfile        # Image frontend (multi-stage Node + nginx)
│   ├── nginx.conf        # Config nginx : SPA + proxy /api/
│   └── .dockerignore
├── infra/                # MySQL + phpMyAdmin seuls (mode local Phase 12)
│   ├── .env.example      # Variables MySQL locales
│   └── mysql-init/       # Schéma SQL initial
├── docker-compose.yml    # Stack complète : MySQL + backend + frontend
├── .env.example          # Variables pour le docker-compose racine
├── docs/                 # Documentation
└── Project_plan.md       # Plan de développement par phases
```

## Variables d'environnement

Les variables backend acceptent des overrides via les propriétés Spring ou le shell :

| Variable | Défaut (dev) | Description |
|----------|-------------|-------------|
| `DB_HOST` | `127.0.0.1` | Hôte MySQL |
| `DB_PORT` | `3307` | Port MySQL |
| `DB_NAME` | `stock_app_db` | Nom de la base |
| `DB_USERNAME` | `Wassimhws` | Utilisateur MySQL |
| `DB_PASSWORD` | *(valeur dans application-dev.properties)* | Mot de passe MySQL |
| `JWT_SECRET` | *(clé de dev Base64)* | Clé de signature JWT — changer en production |
| `JWT_EXPIRATION` | `86400000` | Durée de validité du token en ms (24 h) |
| `STOCKPRO_DEMO_DATA` | `true` | `true` charge les données de démo au démarrage |

**Stack complète Docker** (`.env` à la racine, depuis `.env.example`) :

| Variable | Description |
|----------|-------------|
| `MYSQL_ROOT_PASSWORD` | Mot de passe root du conteneur MySQL |
| `MYSQL_DATABASE` | Nom de la base créée automatiquement |
| `MYSQL_USER` | Compte applicatif créé dans le conteneur |
| `MYSQL_PASSWORD` | Mot de passe du compte applicatif |
| `JWT_SECRET` | Clé de signature JWT (Base64, min. 32 chars) |
| `STOCKPRO_DEMO_DATA` | `true`/`false` — données de démo au démarrage |

**MySQL seul** (mode local Phase 12) : variables dans `infra/.env` depuis `infra/.env.example`.
