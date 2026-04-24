# Observabilité — StockPro

Phase 20 — Prometheus + Grafana + Loki intégrés au backend Spring Boot.

---

## Métriques exposées

### Endpoint de scraping

```
GET /actuator/prometheus
```

Accessible sans authentification (configuré dans `SecurityConfig`). Prometheus scrape cet endpoint toutes les 15 secondes.

---

### Métriques techniques (automatiques via Micrometer)

| Nom de métrique | Type | Description |
|---|---|---|
| `http_server_requests_seconds_count` | Counter | Nombre total de requêtes HTTP par méthode, URI, statut |
| `http_server_requests_seconds_sum` | Counter | Temps total passé sur les requêtes HTTP |
| `http_server_requests_seconds_bucket` | Histogram | Distribution de latence (pour calcul de percentiles) |
| `http_server_requests_seconds_max` | Gauge | Latence maximale observée |
| `jvm_memory_used_bytes` | Gauge | Mémoire JVM utilisée par zone (heap, nonheap) |
| `jvm_memory_max_bytes` | Gauge | Capacité mémoire maximale JVM |
| `jvm_threads_live_threads` | Gauge | Nombre de threads actifs |
| `jvm_gc_pause_seconds_count` | Counter | Nombre de pauses GC |
| `jvm_gc_pause_seconds_sum` | Counter | Durée totale des pauses GC |
| `process_uptime_seconds` | Gauge | Durée de fonctionnement du processus |
| `hikaricp_connections_active` | Gauge | Connexions DB actives dans le pool |
| `up` | Gauge | Backend accessible par Prometheus (1=OK, 0=DOWN) |

### Métriques métier (compteurs personnalisés)

| Nom de métrique | Tags | Description |
|---|---|---|
| `stockpro_mouvements_total` | `type=ENTREE\|SORTIE` | Mouvements de stock acceptés par type |
| `stockpro_mouvements_rejets_total` | `raison=stock_insuffisant\|capacite_depassee` | Mouvements refusés par raison métier |

> Micrometer ajoute automatiquement le suffixe `_total` aux compteurs dans le format Prometheus, et le tag `application=stockpro` est appliqué à toutes les métriques.

---

## Dashboard Grafana

Le dashboard **StockPro — Observabilité** (`uid: stockpro-observability`) est provisionné automatiquement depuis `infra/monitoring/grafana/provisioning/dashboards/stockpro.json`.

### Panels

| Panel | Requête PromQL | Utilité |
|---|---|---|
| Requêtes HTTP par statut | `sum by(status) (rate(http_server_requests_seconds_count[5m]))` | Détecter un pic d'erreurs 4xx/5xx |
| Latence avg et p95 | `rate(sum/count)` et `histogram_quantile(0.95, ...)` | Identifier une dégradation de performance |
| Mémoire heap JVM | `sum(jvm_memory_used_bytes{area="heap"})` | Surveiller la consommation mémoire |
| Threads actifs | `jvm_threads_live_threads` | Détecter un thread leak |
| Backend opérationnel | `up{job="stockpro-backend"}` | Alerte visuelle immédiate si le backend tombe |
| Uptime backend | `process_uptime_seconds` | Vérifier la stabilité |
| Mouvements ENTREE/SORTIE | `increase(stockpro_mouvements_total[1h])` | Activité métier sur la dernière heure |
| Rejets de mouvements | `increase(stockpro_mouvements_rejets_total[5m])` | Détecter des problèmes de stock ou capacité |

---

## Règles d'alerte Prometheus

Fichier : `infra/monitoring/prometheus/rules/stockpro_alerts.yml`

| Alerte | Condition | Délai | Sévérité |
|---|---|---|---|
| `BackendDown` | `up{job="stockpro-backend"} == 0` | 1 minute | critical |
| `HighErrorRate` | Taux 5xx > 5% sur 5 minutes | 5 minutes | warning |
| `StockRejectionsSpike` | > 10 rejets de mouvements en 5 minutes | immédiat | warning |

---

## Interpréter une anomalie

### Pic d'erreurs 5xx dans Grafana
1. Ouvrir le panel **Requêtes HTTP par statut**.
2. Identifier la plage horaire du pic.
3. Aller dans Loki (si configuré) → filtrer sur `level=ERROR` et la même plage.
4. Croiser avec le `correlationId` des logs pour retrouver la requête exacte.

### Rejet de mouvement de stock
1. Le panel **Rejets de mouvements** monte.
2. Le tag `raison` indique `stock_insuffisant` ou `capacite_depassee`.
3. Les logs backend (niveau `WARN`) portent le même `correlationId` que la requête refusée.
4. Chercher dans Loki : `{container="stock-backend"} |= "refuse"`.

### Latence élevée
1. Le panel **Latence p95** dépasse 500ms.
2. Vérifier `hikaricp_connections_active` — un pool saturé ralentit toutes les requêtes.
3. Vérifier les GC pauses (`jvm_gc_pause_seconds_sum` en hausse = GC fréquent).

---

## Logs et corrélation (phase 19 → phase 20)

Chaque requête HTTP reçoit un `correlationId` (8 caractères UUID) positionné dans le MDC et dans l'en-tête de réponse `X-Correlation-Id`.

**En local :**
```
10:42:15.201 WARN  [a3f1bc92] [admin@stockpro.local] MouvementStockService - Mouvement SORTIE refuse : stock insuffisant
```

**En Docker/K8s (JSON) :**
```json
{"timestamp":"...","level":"WARN","correlationId":"a3f1bc92","userEmail":"admin@stockpro.local","message":"Mouvement SORTIE refuse..."}
```

Pour retrouver ce `correlationId` dans Grafana Loki :
```logql
{container="stock-backend"} | json | correlationId = "a3f1bc92"
```

---

## Accès aux interfaces

| Interface | Docker Compose | Kubernetes (port-forward) |
|---|---|---|
| Prometheus | `http://localhost:9090` | `kubectl port-forward svc/stockpro-prometheus 9090:9090 -n stockpro` |
| Grafana | `http://localhost:3000` (admin/admin) | `kubectl port-forward svc/stockpro-grafana 3000:3000 -n stockpro` |
| Loki | `http://localhost:3100` | Non déployé en K8s (optionnel) |
| Actuator Prometheus | `http://localhost:8085/actuator/prometheus` | Via `kubectl port-forward` sur le backend |
