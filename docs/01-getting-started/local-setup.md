# Lancer StockPro en local

## Méthode 1 — Docker Compose (recommandé)

Démarre MySQL, le backend et le frontend en une seule commande. Aucune installation de Java ou Node requise.

### Étapes

```bash
# 1. Cloner le dépôt
git clone https://github.com/wassimhaoues/stock_app.git
cd stock_app

# 2. Créer le fichier de configuration
cp .env.example .env
```

Ouvrir `.env` et remplacer les valeurs `changeme_*` :

```dotenv
MYSQL_ROOT_PASSWORD=un_mot_de_passe_root
MYSQL_DATABASE=stock_app_db
MYSQL_USER=stockpro
MYSQL_PASSWORD=un_mot_de_passe_app

JWT_SECRET=votre_cle_jwt_base64_min_32_chars
STOCKPRO_DEMO_DATA=true
```

Générer une clé JWT sécurisée :

```bash
openssl rand -base64 32
```

```bash
# 3. Démarrer la stack
docker compose up -d

# 4. Suivre le démarrage (optionnel)
docker compose logs -f
```

L'ordre de démarrage est géré par les healthchecks : MySQL → Backend → Frontend. Le backend peut prendre 60–90 secondes à être prêt.

### Vérification

```bash
# État des conteneurs
docker compose ps

# Santé du backend
curl http://localhost:8085/api/health
# {"status":"UP","application":"StockPro"}
```

Ouvrir dans le navigateur :

- Application : http://localhost:4200
- Swagger UI : http://localhost:8085/swagger-ui.html
- Backend direct : http://localhost:8085/api/health

### Connexion

Avec `STOCKPRO_DEMO_DATA=true`, les comptes suivants sont disponibles :

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| `admin@stockpro.local` | `Admin123!` | ADMIN — accès complet |
| `gestionnaire@stockpro.local` | `Gestion123!` | GESTIONNAIRE — entrepôt Tunis Charguia |
| `observateur@stockpro.local` | `Observe123!` | OBSERVATEUR — lecture seule |

---

## Méthode 2 — Natif (Maven + npm)

Utiliser cette méthode pour le développement avec hot-reload. Requiert Java 17, Node.js 20 et une instance MySQL accessible.

### Prérequis base de données

Deux options :

**Option A — MySQL via Docker uniquement (recommandé)**

```bash
# Démarrer seulement MySQL et phpMyAdmin
docker compose up -d stock-db
```

**Option B — MySQL natif**

Créer la base et l'utilisateur :

```sql
CREATE DATABASE stock_app_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'stockpro'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON stock_app_db.* TO 'stockpro'@'localhost';
FLUSH PRIVILEGES;
```

Importer le schéma :

```bash
mysql -u stockpro -p stock_app_db < infra/mysql-init/01-schema.sql
```

### Backend

```bash
cd backend

# Définir les variables d'environnement
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=stock_app_db
export DB_USERNAME=stockpro
export DB_PASSWORD=votre_mot_de_passe
export JWT_SECRET=votre_cle_jwt_base64
export STOCKPRO_DEMO_DATA=true

# Démarrer le backend (profil dev)
./mvnw spring-boot:run
```

Le backend démarre sur http://localhost:8085.

### Frontend

Dans un second terminal :

```bash
cd frontend

# Installer les dépendances (première fois uniquement)
npm ci

# Démarrer le serveur de développement
npm start
```

Le frontend démarre sur http://localhost:4200. Les modifications sont rechargées automatiquement.

---

## Administration de la base de données

Démarrer phpMyAdmin :

```bash
cd infra
docker compose up -d
```

Accéder à http://localhost:8084. Se connecter avec les identifiants définis dans `.env`.

---

## Arrêt et nettoyage

```bash
# Arrêter la stack sans supprimer les données
docker compose stop

# Arrêter et supprimer les conteneurs
docker compose down

# Arrêter, supprimer les conteneurs ET les données MySQL
docker compose down -v
```
