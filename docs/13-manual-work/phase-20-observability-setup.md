# Phase 20 — Travaux manuels : Observabilité

Ce fichier contient toutes les commandes à exécuter **manuellement** pour valider la phase 20.
L'agent a préparé tous les fichiers de configuration. Il te reste à lancer la stack et vérifier chaque point.

---

## Prérequis

- La phase 19 est terminée (backend avec logs structurés).
- Docker et Docker Compose sont installés.
- Le backend tourne ou peut être lancé (`mvn spring-boot:run` ou `docker compose up`).

---

## Étape 1 — Vérifier que le backend expose les métriques

### 1.1 Lancer le backend en local

```bash
cd backend
mvn spring-boot:run
```

### 1.2 Vérifier l'endpoint Prometheus

```bash
curl http://localhost:8085/actuator/prometheus
```

**Résultat attendu :** une longue liste de métriques au format texte commençant par :
```
# HELP jvm_memory_used_bytes ...
# TYPE jvm_memory_used_bytes gauge
jvm_memory_used_bytes{...} ...
```

### 1.3 Vérifier les métriques personnalisées (après au moins un mouvement de stock)

Effectue un mouvement de stock via l'interface ou l'API, puis :

```bash
curl http://localhost:8085/actuator/prometheus | grep stockpro_mouvements
```

**Résultat attendu :**
```
# HELP stockpro_mouvements_rejets_total
# TYPE stockpro_mouvements_rejets_total counter
stockpro_mouvements_rejets_total{...} 0.0
# HELP stockpro_mouvements_total
# TYPE stockpro_mouvements_total counter
stockpro_mouvements_total{application="stockpro",type="ENTREE",...} 1.0
```

---

## Étape 2 — Lancer la stack monitoring avec Docker Compose

> La stack monitoring se greffe sur la stack applicative principale.

### 2.1 Lancer les deux stacks ensemble

```bash
# Depuis la racine du projet
docker compose -f docker-compose.yml -f infra/monitoring/docker-compose.monitoring.yml up -d
```

### 2.2 Vérifier que tous les conteneurs sont UP

```bash
docker compose -f docker-compose.yml -f infra/monitoring/docker-compose.monitoring.yml ps
```

**Conteneurs attendus :** `stock-db`, `stock-backend`, `stock-frontend`, `stockpro-prometheus`, `stockpro-grafana`, `stockpro-loki`, `stockpro-promtail`.

### 2.3 Vérifier les logs de Prometheus (optionnel)

```bash
docker compose -f docker-compose.yml -f infra/monitoring/docker-compose.monitoring.yml logs -f stockpro-prometheus
```

---

## Étape 3 — Vérifier que Prometheus scrape le backend

### 3.1 Ouvrir l'interface Prometheus

Ouvrir dans le navigateur : **http://localhost:9090**

### 3.2 Vérifier la cible (target)

Naviguer vers : **Status → Targets**

**Résultat attendu :** la cible `stockpro-backend` avec l'état **UP** (fond vert).

Si l'état est **DOWN** :
- Vérifier que le backend tourne : `docker compose logs stock-backend`
- Vérifier que le port 8085 est accessible depuis le réseau Docker
- Vérifier que `/actuator/prometheus` répond : `curl http://localhost:8085/actuator/prometheus`

### 3.3 Exécuter une requête PromQL de test

Dans l'interface Prometheus, onglet **Graph**, saisir :

```promql
up{job="stockpro-backend"}
```

**Résultat attendu :** valeur `1`.

---

## Étape 4 — Vérifier Grafana

### 4.1 Ouvrir Grafana

Ouvrir dans le navigateur : **http://localhost:3000**

Identifiants : `admin` / `admin`

### 4.2 Vérifier la datasource Prometheus

Naviguer vers : **Connections → Data sources**

**Résultat attendu :** une datasource `Prometheus` pointant vers `http://stockpro-prometheus:9090` avec le statut **Data source connected and labels found**.

Si la datasource est en erreur :
- Vérifier que Prometheus est UP : `docker compose logs stockpro-prometheus`
- Tester la connectivité depuis Grafana en cliquant **Save & Test**

### 4.3 Importer le dashboard StockPro

Le dashboard est provisionné automatiquement. Pour le vérifier :

Naviguer vers : **Dashboards**

**Résultat attendu :** un dashboard nommé **StockPro — Observabilité** est présent.

Si le dashboard n'apparaît pas automatiquement, l'importer manuellement :
1. Naviguer vers **Dashboards → Import**
2. Uploader le fichier `infra/monitoring/grafana/provisioning/dashboards/stockpro.json`
3. Sélectionner la datasource **Prometheus**
4. Cliquer **Import**

### 4.4 Vérifier les panels du dashboard

Ouvrir le dashboard. Les 8 panels doivent afficher des données :
- **Requêtes HTTP par statut** — courbe avec valeurs
- **Latence des requêtes** — courbe
- **Mémoire heap JVM** — jauge avec valeur en MB
- **Threads JVM actifs** — valeur numérique
- **Backend opérationnel** — affiche **UP** en vert
- **Uptime backend** — durée en secondes
- **Mouvements ENTREE/SORTIE** — courbe (0 si pas encore de mouvement)
- **Rejets de mouvements** — courbe (0 si pas encore de rejet)

---

## Étape 5 — Tester les métriques métier

### 5.1 Générer un mouvement ENTREE accepté

Via l'interface Angular ou directement via curl (s'authentifier d'abord) :

```bash
# Login
curl -s -c cookies.txt -X POST http://localhost:8085/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stockpro.local","password":"Admin123!"}'

# Obtenir le CSRF token
CSRF=$(curl -s -c cookies.txt -b cookies.txt http://localhost:8085/api/auth/csrf | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Créer un mouvement ENTREE (adapter produitId, entrepotId selon vos données)
curl -s -b cookies.txt -X POST http://localhost:8085/api/mouvements-stock \
  -H "Content-Type: application/json" \
  -H "X-XSRF-TOKEN: $CSRF" \
  -d '{"produitId":1,"entrepotId":1,"type":"ENTREE","quantite":5}'
```

### 5.2 Vérifier le compteur dans Prometheus

```bash
curl -s http://localhost:9090/api/v1/query \
  --data-urlencode 'query=stockpro_mouvements_total{type="ENTREE"}' | python3 -m json.tool
```

**Résultat attendu :** la valeur du compteur a augmenté de 1.

### 5.3 Générer un rejet pour déclencher le compteur de rejets

Tenter une sortie avec quantité supérieure au stock disponible :

```bash
curl -s -b cookies.txt -X POST http://localhost:8085/api/mouvements-stock \
  -H "Content-Type: application/json" \
  -H "X-XSRF-TOKEN: $CSRF" \
  -d '{"produitId":1,"entrepotId":1,"type":"SORTIE","quantite":99999}'
```

**Résultat attendu :** réponse 409 Conflict. Vérifier dans Prometheus :

```bash
curl -s http://localhost:9090/api/v1/query \
  --data-urlencode 'query=stockpro_mouvements_rejets_total{raison="stock_insuffisant"}' | python3 -m json.tool
```

---

## Étape 6 — Déclencher l'alerte BackendDown

### 6.1 Arrêter le backend

```bash
docker compose stop stock-backend
```

### 6.2 Vérifier l'alerte dans Prometheus

Ouvrir **http://localhost:9090/alerts**

Après 1 minute, l'alerte `BackendDown` passe à l'état **FIRING** (fond rouge).

### 6.3 Redémarrer le backend

```bash
docker compose start stock-backend
```

Après quelques secondes, l'alerte repasse à **OK**.

---

## Étape 7 — Déploiement Kubernetes (optionnel)

### 7.1 Appliquer les manifests monitoring

```bash
kubectl apply -k k8s/base/monitoring
```

### 7.2 Vérifier les pods

```bash
kubectl get pods -n stockpro -l app.kubernetes.io/part-of=stockpro-monitoring
```

**Résultat attendu :** pods `stockpro-prometheus-*` et `stockpro-grafana-*` à l'état `Running`.

### 7.3 Accéder à Prometheus en K8s

```bash
kubectl port-forward svc/stockpro-prometheus 9090:9090 -n stockpro
```

Ouvrir : **http://localhost:9090**

### 7.4 Accéder à Grafana en K8s

```bash
kubectl port-forward svc/stockpro-grafana 3000:3000 -n stockpro
```

Ouvrir : **http://localhost:3000**

Importer le dashboard depuis `infra/monitoring/grafana/provisioning/dashboards/stockpro.json`.

---

## Checklist de validation finale

- [ ] `curl http://localhost:8085/actuator/prometheus` retourne des métriques valides
- [ ] Prometheus cible `stockpro-backend` est à l'état **UP**
- [ ] Le dashboard Grafana affiche des données réelles pour tous les panels JVM et HTTP
- [ ] Le compteur `stockpro_mouvements_total` s'incrémente après un mouvement accepté
- [ ] Le compteur `stockpro_mouvements_rejets_total` s'incrémente après un mouvement refusé
- [ ] L'alerte `BackendDown` se déclenche quand le backend est arrêté
- [ ] `mvn test` passe sans régression (backend)
- [ ] `npm run build` passe sans régression (frontend)

---

## Nettoyage

Pour arrêter la stack monitoring uniquement :

```bash
docker compose -f infra/monitoring/docker-compose.monitoring.yml down
```

Pour supprimer les volumes monitoring (données Prometheus et Grafana) :

```bash
docker compose -f infra/monitoring/docker-compose.monitoring.yml down -v
```
