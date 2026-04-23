# Phase 19 — Vérification manuelle du logging backend

## Lancer et observer les logs

### Local

```bash
cd backend
./mvnw spring-boot:run
```

### Docker Compose

```bash
docker compose up -d
docker compose logs -f stock-backend
```

### Kubernetes

```bash
kubectl apply -k k8s/overlays/local/
kubectl logs -f deployment/stock-backend -n stockpro
```

## Scénarios à vérifier

1. Login réussi
   Attendu : une ligne `INFO` avec `Connexion reussie pour ...`, un `correlationId`, et l'en-tête `X-Correlation-Id` dans la réponse.
2. Login échoué
   Attendu : une ligne `WARN` côté service pour l'email tenté, puis une ligne `WARN` d'authentification côté handler, sans mot de passe ni token.
3. Accès refusé
   Attendu : une ligne `WARN` indiquant l'utilisateur (`userEmail`) qui a été refusé.
4. Mouvement `ENTREE` accepté
   Attendu : une ligne `INFO` avec le type de mouvement, les ids produit/entrepôt et la quantité.
5. Mouvement `SORTIE` refusé
   Attendu : une ligne `WARN` avec les quantités disponibles et demandées.
6. Erreur `500` simulée
   Attendu : une ligne `ERROR` avec stack trace complète et `correlationId`.

## Checklist de sécurité

- Vérifier qu'aucun token JWT n'apparaît dans les logs.
- Vérifier qu'aucun mot de passe n'apparaît dans les logs.
- Vérifier qu'aucune valeur de cookie n'apparaît dans les logs.
- Vérifier que `userEmail` vaut `anonymous` pour une requête non authentifiée.
- Vérifier que le `correlationId` de la réponse HTTP est identique à celui des logs associés.
