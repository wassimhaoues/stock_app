# Développement backend

## Stack technique

- Spring Boot 4.0.5
- Java 17
- Maven 3.9 (via wrapper `mvnw`)
- MySQL 8.0
- SpringDoc OpenAPI (Swagger)
- JUnit 5 + Mockito + MockMvc (tests)

## Profils Spring

| Profil | Fichier | Utilisation |
|--------|---------|-------------|
| `dev` | `application-dev.properties` | Développement local natif. Se connecte à MySQL sur `localhost:3306`. |
| `docker` | `application-docker.properties` | Conteneur Docker Compose. Se connecte à `stock-db:3306` (service interne). |

Le profil par défaut est `dev`. Docker Compose injecte `SPRING_PROFILES_ACTIVE=docker`.

## Lancer le backend

### Avec les variables d'environnement exportées

```bash
cd backend

export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=stock_app_db
export DB_USERNAME=stockpro
export DB_PASSWORD=votre_mot_de_passe
export JWT_SECRET=$(openssl rand -base64 32)
export STOCKPRO_DEMO_DATA=true

./mvnw spring-boot:run
```

### Avec un fichier de propriétés IDE

Dans IntelliJ IDEA :

1. Run → Edit Configurations → Spring Boot
2. Onglet "Environment" → "Environment variables"
3. Coller les paires clé=valeur

## Vérification

```bash
# Santé de l'application
curl http://localhost:8085/api/health

# Swagger UI
open http://localhost:8085/swagger-ui.html

# JSON OpenAPI
curl http://localhost:8085/v3/api-docs
```

## Commandes Maven utiles

```bash
# Compiler uniquement
./mvnw compile

# Lancer les tests
./mvnw test

# Build complet (tests + JAR)
./mvnw package

# Build sans tests
./mvnw package -DskipTests

# Nettoyer le répertoire target/
./mvnw clean

# Rapport de couverture JaCoCo
./mvnw verify
# Rapport HTML : target/site/jacoco/index.html
```

## Structure du code source

```
backend/src/main/java/com/wassim/stock/
├── StockBackendApplication.java    Point d'entrée Spring Boot
├── config/                         CorsConfig, DataInitializer, SecurityConfig
├── controller/                     Contrôleurs REST
├── dto/                            Objets de transfert (entrée/sortie API)
├── entity/                         Entités JPA (Utilisateur, Entrepot, Produit…)
├── exception/                      GlobalExceptionHandler, exceptions métier
├── repository/                     Interfaces Spring Data JPA
├── security/                       JwtUtil, JwtAuthFilter, UserDetailsServiceImpl
└── service/                        Logique métier
```

## Format d'erreur standard

Toutes les erreurs API retournent :

```json
{
  "status": 400,
  "message": "Message métier lisible",
  "timestamp": "2026-04-21T19:00:00"
}
```

Les erreurs de validation de formulaire ajoutent un champ `errors` avec les messages par champ.

## CORS

Les origines CORS autorisées sont configurées via `CORS_ALLOWED_ORIGINS` :

- Développement local : `http://localhost:4200`
- Kubernetes local : `http://localhost:30080`
- Production/GitOps : valeur injectée via ConfigMap K8s
