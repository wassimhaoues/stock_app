# Tests frontend

## Stack de tests

- **Vitest** — runner de tests (compatible Angular 21, beaucoup plus rapide que Jest)
- **jsdom** — simulation du DOM pour les tests en environnement Node.js
- **Angular TestBed** — contexte Angular complet pour les tests de composants
- **@testing-library/angular** — utilitaires pour tester les interactions utilisateur

## Lancer les tests

```bash
cd frontend

# Lancer les tests en mode watch (développement)
npm test

# Lancer les tests une seule fois (CI)
npm run test:ci

# Lancer avec rapport de couverture
npm run test:coverage
# Rapport HTML : frontend/coverage/stockpro-frontend/index.html
```

## Configuration Vitest

Le fichier `vitest.config.ts` configure :
- Environnement : `jsdom`
- Rapport de couverture : `lcov` (pour SonarCloud) + `html` (pour la lecture locale)
- Fichiers inclus : `**/*.spec.ts`

## Structure des tests

```
frontend/src/app/
├── core/services/          Tests des services HTTP (AuthService, etc.)
├── features/*/             Tests des composants par fonctionnalité
└── shared/                 Tests des composants partagés
```

## Exemples de cas testés

### Guards et navigation

- `AuthGuard` redirige vers `/login` si non connecté
- `RoleGuard` refuse l'accès à `/utilisateurs` pour `GESTIONNAIRE`
- Redirection post-login selon le rôle

### Composants

- Le formulaire de login appelle `AuthService.login()` avec les bonnes valeurs
- Les boutons Créer/Modifier/Supprimer sont masqués pour `OBSERVATEUR`
- Les états `loading`, `empty` et `error` sont rendus correctement

### Services

```typescript
// Exemple : tester que le token est attaché aux requêtes
it('should attach JWT token to requests', () => {
  authService.setToken('test.jwt.token');
  const req = httpTesting.expectOne('/api/stocks');
  expect(req.request.headers.get('Authorization')).toBe('Bearer test.jwt.token');
});
```

## Rapport de couverture LCOV

```bash
npm run test:coverage
# Rapport HTML : coverage/stockpro-frontend/index.html
# Fichier LCOV : coverage/stockpro-frontend/lcov.info (utilisé par SonarCloud)
```

## Note sur Angular 21

Angular 21 utilise le paradigme des signaux et `ChangeDetectionStrategy.OnPush`. Les tests doivent appeler `fixture.detectChanges()` explicitement après chaque modification d'état.
