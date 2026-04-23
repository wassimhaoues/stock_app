# Logging backend

## Niveaux de log

| Niveau | Usage dans StockPro |
|--------|---------------------|
| `DEBUG` | Détails de diagnostic en développement local uniquement (`dev`), par exemple absence de token JWT sur une requête |
| `INFO` | Événements métier acceptés et étapes utiles d'exploitation : login réussi, création ou mise à jour de stock, mouvement enregistré, chargement des données de démo |
| `WARN` | Rejets attendus ou situations anormales mais contrôlées : accès refusé, authentification échouée, 400/403/404/409, token invalide, capacité ou stock insuffisant |
| `ERROR` | Erreurs inattendues côté serveur avec stack trace complète pour diagnostic |

## Evénements loggés

| Evénement | Niveau |
|----------|--------|
| Connexion réussie | `INFO` |
| Echec de connexion | `WARN` |
| Token JWT absent | `DEBUG` |
| Token JWT invalide ou expiré | `WARN` |
| Ressource introuvable | `WARN` |
| Requête invalide / conflit métier / validation | `WARN` |
| Accès refusé | `WARN` |
| Création de stock acceptée | `INFO` |
| Mise à jour de stock acceptée | `INFO` |
| Création de stock refusée pour capacité insuffisante | `WARN` |
| Mouvement d'entrée ou de sortie accepté | `INFO` |
| Mouvement de sortie refusé pour stock insuffisant | `WARN` |
| Mouvement d'entrée refusé pour capacité insuffisante | `WARN` |
| Chargement des données de démo / création de compte admin initial | `INFO` |
| Exception inattendue | `ERROR` |

## Formats par environnement

- Profil `dev` : logs console lisibles avec timestamp, niveau, `correlationId`, `userEmail`, logger court et message.
- Profils `docker` et `k8s` : logs JSON structurés sur la sortie standard pour faciliter la collecte et l'indexation.
- Niveaux par défaut : racine en `INFO`, `org.springframework.security` et `org.hibernate.SQL` en `WARN`, avec `com.wassim.stock` en `DEBUG` seulement en `dev`.

## Lire les logs

- Local Spring Boot : `cd backend && ./mvnw spring-boot:run`
- Docker Compose : `docker compose logs -f stock-backend`
- Kubernetes : `kubectl logs -f deployment/stock-backend -n stockpro`

## CorrelationId

- Chaque requête HTTP reçoit un `correlationId` court, ajouté dans le MDC et renvoyé dans l'en-tête `X-Correlation-Id`.
- Le même identifiant apparaît dans toutes les lignes de log générées pendant la requête.
- Pour tracer un incident signalé depuis le frontend, relever la valeur `X-Correlation-Id` dans la réponse HTTP puis filtrer les logs avec cette valeur.

## Règles de sécurité

- Aucun mot de passe, token JWT, cookie ou secret d'infrastructure ne doit être écrit dans les logs.
- Les emails utilisateurs sont utilisés comme contexte métier (`userEmail`) et restent autorisés.
- Les stack traces complètes sont réservées aux entrées `ERROR`.
