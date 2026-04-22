# StockPro — Product Backlog

**Projet :** StockPro  
**Domaine :** Gestion multi-entrepôts / inventory management  
**Statut global du produit :** fonctionnalité métier avancée déjà présente, industrialisation DevOps à terminer

---

## 1. Vision produit

StockPro est une application web de gestion de stocks multi-entrepôts destinée à centraliser le suivi des produits, des quantités, des mouvements et des alertes métier.

Le produit doit permettre :

- la gestion sécurisée des utilisateurs et des rôles
- la consultation et la gestion des entrepôts
- le suivi temps réel des stocks et des mouvements
- la maîtrise de la capacité des entrepôts
- la détection des alertes de stock faible
- l’analyse opérationnelle via un dashboard métier

---

## 2. Périmètre fonctionnel

### Inclus

- authentification JWT
- gestion des utilisateurs
- gestion des entrepôts
- gestion du catalogue produits
- gestion des stocks
- gestion des mouvements d’entrée/sortie
- calcul de capacité d’entrepôt
- alertes stock faible
- dashboard analytique
- documentation technique

### Exclu

- gestion RH ou paie
- WMS avancé
- multi-tenant cloud complexe
- audit légal complet
- workflow de commande client

---

## 3. Utilisateurs cibles et rôles

| Rôle                   | Responsabilité métier                         | Niveau d’accès                                           |
| ---------------------- | --------------------------------------------- | -------------------------------------------------------- |
| **ADMIN**              | Supervision globale, paramétrage, gouvernance | Accès complet                                            |
| **GESTIONNAIRE stock** | Pilotage d’un entrepôt affecté                | Lecture globale des produits, CRUD limité à son entrepôt |
| **OBSERVATEUR**        | Consultation opérationnelle                   | Lecture seule sur son entrepôt affecté                   |

### Règles d’accès

- l’`ADMIN` gère tous les modules
- le `GESTIONNAIRE stock` travaille uniquement sur l’entrepôt qui lui est affecté
- l’`OBSERVATEUR` ne fait aucune écriture
- les données d’entrepôt sont filtrées côté backend, pas seulement côté interface
- les produits restent un catalogue global

---

## 4. Convention de priorisation

| Priorité | Signification                             |
| -------- | ----------------------------------------- |
| **P0**   | indispensable pour une démo fonctionnelle |
| **P1**   | très important pour la soutenance         |
| **P2**   | amélioration utile, mais non bloquante    |

---

## 5. État global du projet

| Bloc                                    | Statut |
| --------------------------------------- | ------ |
| Fondations applicatives                 | Done   |
| Sécurité et rôles                       | Done   |
| Métier entrepôts / produits / stocks    | Done   |
| Alertes et analytics métier             | Done   |
| UI polish, validation finale, packaging | To do  |

---

## 6. Backlog par épic

## EPIC A — Plateforme sécurisée et gouvernée

**Objectif :** sécuriser l’accès au produit et garantir la séparation des droits par rôle.

**Valeur métier :** les utilisateurs n’accèdent qu’aux données qu’ils sont autorisés à voir ou modifier.

| ID   | User story                                                                                                                       | Priorité | Statut |
| ---- | -------------------------------------------------------------------------------------------------------------------------------- | -------: | ------ |
| A-01 | En tant qu’utilisateur, je veux me connecter avec un JWT pour accéder à l’application de manière sécurisée.                      |       P0 | Done   |
| A-02 | En tant qu’ADMIN, je veux créer, modifier et supprimer des utilisateurs afin d’administrer les comptes.                          |       P0 | Done   |
| A-03 | En tant qu’ADMIN, je veux affecter un utilisateur à un entrepôt pour contrôler le périmètre du gestionnaire et de l’observateur. |       P0 | Done   |
| A-04 | En tant que système, je veux appliquer les permissions côté backend pour empêcher les accès non autorisés.                       |       P0 | Done   |
| A-05 | En tant qu’utilisateur, je veux être redirigé selon mon rôle afin d’avoir une interface adaptée.                                 |       P1 | Done   |

**Critères d’acceptation clés**

- un `ADMIN` peut tout faire
- un `GESTIONNAIRE stock` ne sort jamais de son entrepôt affecté
- un `OBSERVATEUR` ne peut jamais écrire
- les refus d’accès sont explicites

---

## EPIC B — Référentiel logistique

**Objectif :** administrer les entrepôts et le catalogue produits.

**Valeur métier :** disposer d’un référentiel propre et exploitable pour les stocks.

| ID   | User story                                                                                                  | Priorité | Statut |
| ---- | ----------------------------------------------------------------------------------------------------------- | -------: | ------ |
| B-01 | En tant qu’ADMIN, je veux gérer les entrepôts pour structurer l’organisation logistique.                    |       P0 | Done   |
| B-02 | En tant qu’ADMIN, je veux gérer le catalogue produits pour référencer les articles.                         |       P0 | Done   |
| B-03 | En tant que GESTIONNAIRE stock, je veux consulter le catalogue produits sans pouvoir le modifier.           |       P1 | Done   |
| B-04 | En tant que système, je veux relier les comptes non-admin à un entrepôt précis.                             |       P0 | Done   |
| B-05 | En tant qu’utilisateur, je veux voir des formulaires clairs et cohérents pour éviter les erreurs de saisie. |       P1 | Done   |

**Critères d’acceptation clés**

- les entrepôts et produits sont CRUD complets pour l’ADMIN
- les rôles non-admin ont une vue sécurisée et filtrée
- les données de base restent cohérentes

---

## EPIC C — Stocks et mouvements opérationnels

**Objectif :** gérer les quantités de stock et les flux d’entrée/sortie.

**Valeur métier :** suivre les quantités réelles par produit et entrepôt.

| ID   | User story                                                                                                         | Priorité | Statut |
| ---- | ------------------------------------------------------------------------------------------------------------------ | -------: | ------ |
| C-01 | En tant qu’ADMIN ou GESTIONNAIRE, je veux créer et modifier un stock pour un produit et un entrepôt donnés.        |       P0 | Done   |
| C-02 | En tant qu’ADMIN ou GESTIONNAIRE, je veux enregistrer une entrée de stock afin d’augmenter la quantité disponible. |       P0 | Done   |
| C-03 | En tant qu’ADMIN ou GESTIONNAIRE, je veux enregistrer une sortie de stock afin de diminuer la quantité disponible. |       P0 | Done   |
| C-04 | En tant que système, je veux refuser une sortie si le stock est insuffisant.                                       |       P0 | Done   |
| C-05 | En tant que système, je veux empêcher qu’un stock dépasse la capacité de son entrepôt.                             |       P0 | Done   |
| C-06 | En tant qu’OBSERVATEUR, je veux consulter les stocks sans pouvoir les modifier.                                    |       P0 | Done   |

**Critères d’acceptation clés**

- un couple **produit + entrepôt** est unique
- les quantités sont toujours cohérentes
- la capacité d’entrepôt est une règle métier réelle

---

## EPIC D — Alertes et pilotage analytique

**Objectif :** détecter les risques et fournir une vision de pilotage.

**Valeur métier :** aider à la décision grâce aux alertes et au dashboard.

| ID   | User story                                                                                             | Priorité | Statut |
| ---- | ------------------------------------------------------------------------------------------------------ | -------: | ------ |
| D-01 | En tant qu’utilisateur, je veux voir les alertes de stock faible liées à mon périmètre.                |       P0 | Done   |
| D-02 | En tant qu’ADMIN, je veux voir les alertes globales pour avoir une vision consolidée.                  |       P0 | Done   |
| D-03 | En tant que gestionnaire, je veux un dashboard filtré sur mon entrepôt pour piloter l’activité locale. |       P0 | Done   |
| D-04 | En tant qu’ADMIN, je veux un dashboard global avec KPI et tendances pour piloter le système.           |       P0 | Done   |
| D-05 | En tant que système, je veux afficher les stocks proches du seuil pour prévenir les ruptures.          |       P1 | Done   |

**Critères d’acceptation clés**

- les alertes sont basées sur les données réelles
- les KPI ne sont pas fictifs
- la lecture reste simple pour la soutenance

---

## EPIC E — Expérience utilisateur et finition produit

**Objectif :** transformer l’application fonctionnelle en produit présentable.

**Valeur métier :** donner une interface crédible, claire et professionnelle.

| ID   | User story                                                                                                   | Priorité | Statut |
| ---- | ------------------------------------------------------------------------------------------------------------ | -------: | ------ |
| E-01 | En tant qu’utilisateur, je veux une interface propre et homogène pour travailler efficacement.               |       P1 | To do  |
| E-02 | En tant qu’utilisateur, je veux que les pages n’affichent plus de texte de prototype ou de phase de travail. |       P1 | To do  |
| E-03 | En tant qu’utilisateur, je veux des états de chargement, d’erreur et de vide clairs.                         |       P1 | To do  |
| E-04 | En tant qu’OBSERVATEUR, je veux voir uniquement une interface de lecture seule.                              |       P0 | To do  |
| E-05 | En tant que jury, je veux voir une application finie, cohérente et crédible.                                 |       P0 | To do  |

**Critères d’acceptation clés**

- l’UI est en français
- les actions interdites ne sont pas affichées
- l’application semble livrable à un client
