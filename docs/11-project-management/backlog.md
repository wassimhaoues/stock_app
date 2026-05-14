# Backlog produit

**Domaine :** Gestion de stock multi-entrepôts

## Vision produit

StockPro centralise le suivi des stocks, des mouvements et des alertes métier pour plusieurs entrepôts. Le produit permet la gestion sécurisée des utilisateurs par rôle, le suivi temps réel des stocks et des mouvements, la maîtrise de la capacité d'entrepôt, et l'analyse opérationnelle via un dashboard métier.

## Périmètre fonctionnel

**Inclus :** authentification JWT, gestion des utilisateurs, gestion des entrepôts, catalogue produits, gestion des stocks, mouvements d'entrée/sortie, calcul de capacité, alertes stock faible, dashboard analytique.

**Exclu :** gestion RH/paie, WMS avancé, multi-tenant cloud complexe, audit légal complet, workflow de commande client.

## Convention de priorisation

| Priorité | Signification |
|----------|---------------|
| P0 | Indispensable pour une démo fonctionnelle |
| P1 | Très important pour la soutenance |
| P2 | Amélioration utile, non bloquante |

---

## EPIC A — Plateforme sécurisée et gouvernée

Sécuriser l'accès et garantir la séparation des droits par rôle.

| ID | User story | Priorité | Statut |
|----|-----------|----------|--------|
| A-01 | En tant qu'utilisateur, je veux me connecter avec un JWT pour accéder à l'application de manière sécurisée. | P0 | Terminé |
| A-02 | En tant qu'ADMIN, je veux créer, modifier et supprimer des utilisateurs afin d'administrer les comptes. | P0 | Terminé |
| A-03 | En tant qu'ADMIN, je veux affecter un utilisateur à un entrepôt pour contrôler le périmètre du gestionnaire et de l'observateur. | P0 | Terminé |
| A-04 | En tant que système, je veux appliquer les permissions côté backend pour empêcher les accès non autorisés. | P0 | Terminé |
| A-05 | En tant qu'utilisateur, je veux être redirigé selon mon rôle afin d'avoir une interface adaptée. | P1 | Terminé |

---

## EPIC B — Référentiel logistique

Administrer les entrepôts et le catalogue produits.

| ID | User story | Priorité | Statut |
|----|-----------|----------|--------|
| B-01 | En tant qu'ADMIN, je veux gérer les entrepôts pour structurer l'organisation logistique. | P0 | Terminé |
| B-02 | En tant qu'ADMIN, je veux gérer le catalogue produits pour référencer les articles. | P0 | Terminé |
| B-03 | En tant que GESTIONNAIRE, je veux consulter le catalogue produits sans pouvoir le modifier. | P1 | Terminé |
| B-04 | En tant que système, je veux relier les comptes non-admin à un entrepôt précis. | P0 | Terminé |
| B-05 | En tant qu'utilisateur, je veux des formulaires clairs et cohérents pour éviter les erreurs de saisie. | P1 | Terminé |

---

## EPIC C — Stocks et mouvements opérationnels

Gérer les quantités de stock et les flux d'entrée/sortie.

| ID | User story | Priorité | Statut |
|----|-----------|----------|--------|
| C-01 | En tant qu'ADMIN ou GESTIONNAIRE, je veux créer et modifier un stock pour un produit et un entrepôt donnés. | P0 | Terminé |
| C-02 | En tant qu'ADMIN ou GESTIONNAIRE, je veux enregistrer une entrée de stock afin d'augmenter la quantité disponible. | P0 | Terminé |
| C-03 | En tant qu'ADMIN ou GESTIONNAIRE, je veux enregistrer une sortie de stock afin de diminuer la quantité disponible. | P0 | Terminé |
| C-04 | En tant que système, je veux refuser une sortie si le stock est insuffisant. | P0 | Terminé |
| C-05 | En tant que système, je veux empêcher qu'un stock dépasse la capacité de son entrepôt. | P0 | Terminé |
| C-06 | En tant qu'OBSERVATEUR, je veux consulter les stocks sans pouvoir les modifier. | P0 | Terminé |

---

## EPIC D — Alertes et pilotage analytique

Détecter les risques et fournir une vision de pilotage.

| ID | User story | Priorité | Statut |
|----|-----------|----------|--------|
| D-01 | En tant qu'utilisateur, je veux voir les alertes de stock faible liées à mon périmètre. | P0 | Terminé |
| D-02 | En tant qu'ADMIN, je veux voir les alertes globales pour avoir une vision consolidée. | P0 | Terminé |
| D-03 | En tant que GESTIONNAIRE, je veux un dashboard filtré sur mon entrepôt pour piloter l'activité locale. | P0 | Terminé |
| D-04 | En tant qu'ADMIN, je veux un dashboard global avec KPI et tendances pour piloter le système. | P0 | Terminé |
| D-05 | En tant que système, je veux afficher les stocks proches du seuil pour prévenir les ruptures. | P1 | Terminé |

---

## EPIC E — Expérience utilisateur et finition produit

Transformer l'application fonctionnelle en produit présentable.

| ID | User story | Priorité | Statut |
|----|-----------|----------|--------|
| E-01 | En tant qu'utilisateur, je veux une interface propre et homogène pour travailler efficacement. | P1 | Terminé |
| E-02 | En tant qu'utilisateur, je veux que les pages n'affichent plus de texte de prototype ou de phase de travail. | P1 | Terminé |
| E-03 | En tant qu'utilisateur, je veux des états de chargement, d'erreur et de vide clairs. | P1 | Terminé |
| E-04 | En tant qu'OBSERVATEUR, je veux voir uniquement une interface de lecture seule. | P0 | Terminé |
| E-05 | En tant que jury, je veux voir une application finie, cohérente et crédible. | P0 | Terminé |

---

## EPIC F — Déploiement cloud GKE et GitOps multi-environnements

Étendre le déploiement Kubernetes vers GKE sans casser le flux local `kind`.

| ID | User story | Priorité | Statut |
|----|-----------|----------|--------|
| F-01 | En tant que démonstrateur, je veux conserver l'overlay `local` sur `kind` afin de ne pas casser le scénario de développement et de test actuel. | P0 | Prévu |
| F-02 | En tant qu'exploitant, je veux un overlay GKE distinct afin d'appliquer des choix cloud spécifiques sans polluer l'overlay GitOps local existant. | P0 | Prévu |
| F-03 | En tant qu'exploitant, je veux exposer l'application GKE via `Ingress` plutôt que `NodePort` afin d'utiliser le mécanisme réseau standard de GKE. | P0 | Prévu |
| F-04 | En tant que système, je veux que le pipeline CD mette à jour les tags d'images dans tous les overlays GitOps cibles afin qu'un même merge puisse déclencher plusieurs synchronisations ArgoCD. | P0 | Prévu |
| F-05 | En tant qu'opérateur, je veux pouvoir brancher `gcloud` sur le projet `Stock-management` et activer les APIs minimales avec un guide pas à pas. | P0 | Prévu |
| F-06 | En tant qu'opérateur, je veux créer un cluster GKE Standard à un seul nœud pour faire une démonstration crédible tout en limitant la consommation de crédits. | P0 | Prévu |
| F-07 | En tant qu'utilisateur GitOps, je veux qu'ArgoCD puisse déployer vers GKE même si le cluster `kind` local n'est pas démarré. | P1 | Prévu |
| F-08 | En tant qu'utilisateur avancé, je veux qu'un cluster `kind` avec ArgoCD local puisse aussi suivre les tags GHCR si je l'exécute en parallèle du cluster GKE. | P1 | Prévu |
