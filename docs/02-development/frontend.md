# Développement frontend

## Stack technique

- Angular 21
- Angular Material (composants UI)
- TypeScript
- Vitest + jsdom (tests)
- nginx (production/conteneur)

## Démarrer le serveur de développement

```bash
cd frontend

# Installer les dépendances (première fois ou après modification de package.json)
npm ci

# Démarrer le serveur de développement
npm start
```

L'application est disponible sur http://localhost:4200.

Le proxy `ng serve` redirige automatiquement `/api/**` vers `http://localhost:8085`. Il n'est donc pas nécessaire de configurer CORS pendant le développement natif.

## Commandes npm utiles

```bash
# Démarrer le serveur de développement (avec hot-reload)
npm start

# Build de production
npm run build

# Lancer les tests unitaires
npm test

# Tests avec rapport de couverture
npm run test:coverage
# Rapport HTML : coverage/stockpro-frontend/index.html

# Vérifier le formatage (Prettier)
npm run format:check

# Appliquer le formatage automatiquement
npm run format

# Audit des dépendances npm (niveau high+)
npm audit --audit-level=high
```

## Structure du code source

```
frontend/src/app/
├── core/
│   ├── services/       AuthService, intercepteurs HTTP, guards
│   ├── models/         Interfaces TypeScript (Utilisateur, Entrepot, Produit…)
│   └── guards/         AuthGuard, RoleGuard
├── features/           Modules fonctionnels par domaine
│   ├── auth/           Login
│   ├── dashboard/      Dashboard analytique
│   ├── entrepots/      Gestion des entrepôts
│   ├── produits/       Catalogue produits
│   ├── stocks/         Stocks et mouvements
│   ├── alertes/        Alertes stock faible
│   └── utilisateurs/   Administration (ADMIN uniquement)
├── shared/             Composants, pipes et directives réutilisables
├── layout/             AppShell, sidebar, header
├── app.routes.ts       Routes avec lazy loading
└── app.ts              Composant racine
```

## Authentification

L'intercepteur HTTP dans `core/` active `withCredentials` pour les appels `/api/**`. Le JWT est porté par le cookie HTTP-only `STOCKPRO_AUTH`; il n'est pas stocké dans `localStorage`.

Avant la connexion, `AuthService` appelle `GET /api/auth/csrf`, puis `POST /api/auth/login`. Le backend pose le cookie JWT et le frontend conserve seulement l'utilisateur courant en mémoire.

Les routes protégées utilisent `AuthGuard` (connecté) et `RoleGuard` (rôle requis).

## Variables d'environnement Angular

Angular ne lit pas de fichier `.env`. La configuration côté frontend est dans `src/environments/` :

- `environment.ts` : développement (pointe vers `http://localhost:8085`)
- `environment.prod.ts` : production (URL relative, le proxy nginx gère le routing)

En production (Docker ou K8s), le frontend tourne sous nginx. Le fichier `nginx.conf` configure le proxy `/api/` vers le backend et le routing SPA.

## Build de production

```bash
npm run build
# Artefacts dans dist/stockpro-frontend/
```

Le Dockerfile frontend utilise ce build pour servir l'application avec nginx.
