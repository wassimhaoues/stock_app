# Tests backend

## Stack de tests

- **JUnit 5** — runner de tests
- **Mockito** — mocking des dépendances
- **MockMvc** — simulation des requêtes HTTP sans serveur réel
- **Spring Boot Test** — contexte Spring complet pour les tests d'intégration
- **H2** — base de données en mémoire pour les tests (isolée de MySQL)

## Lancer les tests

```bash
cd backend

# Lancer tous les tests
./mvnw test

# Lancer avec rapport de couverture JaCoCo
./mvnw verify

# Lancer un test spécifique
./mvnw test -Dtest=StockServiceTest

# Lancer une méthode de test spécifique
./mvnw test -Dtest=StockServiceTest#testSortieStockInsuffisant
```

## Rapport de couverture

```bash
./mvnw verify
# Rapport HTML : backend/target/site/jacoco/index.html
open backend/target/site/jacoco/index.html
```

## Structure des tests

```
backend/src/test/java/com/wassim/stock/
├── controller/         Tests MockMvc des contrôleurs REST
├── service/            Tests unitaires des services avec mocks
└── security/           Tests des filtres JWT et de l'authentification
```

## Exemples de cas testés

### Tests de sécurité

- Accès refusé sans token JWT
- Accès refusé avec token expiré
- `OBSERVATEUR` ne peut pas créer de stock (403)
- `GESTIONNAIRE` ne peut pas accéder à un entrepôt non affecté (403)

### Tests métier

- Sortie de stock refusée si quantité insuffisante (409)
- Entrée refusée si capacité d'entrepôt dépassée (409)
- Email utilisateur unique (sans tenir compte de la casse)
- Un couple produit/entrepôt ne peut avoir qu'une ligne de stock

### Tests API (MockMvc)

```java
// Exemple : tester l'accès refusé
mockMvc.perform(post("/api/stocks")
    .header("Authorization", "Bearer " + tokenObservateur)
    .contentType(MediaType.APPLICATION_JSON)
    .content(stockJson))
    .andExpect(status().isForbidden());
```

## Configuration H2

Les tests utilisent une base H2 en mémoire configurée dans `src/test/resources/application.properties`. Le schéma est recréé à chaque exécution de test.

## Exclusions de couverture

Les classes suivantes sont exclues du calcul de couverture SonarCloud (`sonar.coverage.exclusions`) :
- DTOs (`dto/**`)
- Entités JPA (`entity/**`)
- Repositories (`repository/**`)
- Classes de configuration (`config/**`)
