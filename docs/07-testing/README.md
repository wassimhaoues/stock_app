# 07 — Tests

| Fichier | Contenu |
|---------|---------|
| [backend.md](backend.md) | Tests JUnit, Mockito, MockMvc, couverture JaCoCo |
| [frontend.md](frontend.md) | Tests Vitest, jsdom, Angular TestBed, couverture LCOV |

## Stratégie de tests

| Couche | Framework | Type |
|--------|-----------|------|
| Backend services | JUnit 5 + Mockito | Tests unitaires avec mocks des repositories |
| Backend API | MockMvc + Spring Boot Test | Tests d'intégration des contrôleurs |
| Frontend composants | Vitest + Angular TestBed | Tests unitaires de composants |
| Frontend services | Vitest + jsdom | Tests unitaires des services HTTP |

## Lancer tous les tests

```bash
# Backend
cd backend && ./mvnw test

# Frontend
cd frontend && npm test
```

## Seuil de couverture

SonarCloud impose une couverture minimale de **80% sur le nouveau code**. La CI bloque si ce seuil n'est pas atteint sur une PR vers `main`.
