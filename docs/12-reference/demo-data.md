# Données de démonstration

La variable `STOCKPRO_DEMO_DATA` contrôle le chargement des données au démarrage du backend.

| Valeur | Comportement |
|--------|--------------|
| `true` | Crée le compte admin minimal, puis ajoute le jeu de démonstration s'il manque |
| `false` | Crée seulement le compte admin minimal |

Dans la configuration applicative par défaut, `STOCKPRO_DEMO_DATA` vaut `true` si la variable est absente.

## Comptes

| Rôle | Nom | Email | Mot de passe | Périmètre |
|------|-----|-------|--------------|-----------|
| `ADMIN` | Wassim Haoues | `admin@stockpro.local` | `Admin123!` | Tous les entrepôts |
| `GESTIONNAIRE` | Youssef Trabelsi | `gestionnaire@stockpro.local` | `Gestion123!` | Entrepôt Tunis Charguia |
| `OBSERVATEUR` | Ines Mansouri | `observateur@stockpro.local` | `Observe123!` | Entrepôt Tunis Charguia |
| `GESTIONNAIRE` | Sarra Jlassi | `gestionnaire.sfax@stockpro.local` | `Gestion123!` | Entrepôt Sfax Poudrière |
| `OBSERVATEUR` | Mehdi Ayari | `observateur.sousse@stockpro.local` | `Observe123!` | Entrepôt Sousse Akouda |
| `GESTIONNAIRE` | Nour Baccouche | `gestionnaire.nabeul@stockpro.local` | `Gestion123!` | Entrepôt Nabeul Mrezga |

Les comptes seedés sont créés seulement s'ils n'existent pas déjà.

## Entrepôts

| Nom | Adresse | Capacité |
|-----|---------|----------|
| Entrepôt Tunis Charguia | Zone industrielle Charguia 2, Tunis | 900 |
| Entrepôt Sfax Poudrière | Route de Gabès, Sfax | 700 |
| Entrepôt Sousse Akouda | Zone logistique Akouda, Sousse | 650 |
| Entrepôt Nabeul Mrezga | Route touristique Mrezga, Nabeul | 420 |

## Produits

| Produit | Catégorie | Fournisseur | Prix | Seuil min |
|---------|-----------|-------------|------|-----------|
| Gamer MSI Thin 15 B13UCX i5 13è Gén 24G RTX 2050 | Gaming | Tunisianet | 2499.00 | 6 |
| Lenovo ThinkPad E14 i7 13è Gén 16G SSD 512G | Informatique | Scoop Informatique | 3290.00 | 8 |
| Apple iPhone 15 128 Go Noir | Téléphonie | iStore Tunisie | 3899.00 | 8 |
| Samsung Galaxy A55 5G 256 Go Bleu | Téléphonie | Samsung Tunisie | 1699.00 | 12 |
| TV Samsung Crystal UHD 55 pouces 4K | TV | Samsung Tunisie | 2199.00 | 5 |
| LG OLED C3 65 pouces 4K Smart TV | TV | LG Tunisie | 5999.00 | 3 |
| Canon EOS R50 Kit 18-45mm | Photo | CameraPro Tunisie | 2799.00 | 4 |
| Sony WH-1000XM5 Noir | Son | Mytek | 1399.00 | 7 |
| JBL PartyBox 310 | Son | Tunisianet | 1899.00 | 6 |
| Lave-linge Samsung EcoBubble 9kg | Électroménager | Samsung Tunisie | 1999.00 | 4 |
| Réfrigérateur LG No Frost 384L | Électroménager | LG Tunisie | 2490.00 | 4 |
| HP LaserJet Pro M404dn | Informatique | Mytek | 899.00 | 10 |
| PlayStation 5 Slim Standard | Gaming | GamesZone Tunisie | 2599.00 | 5 |
| Nintendo Switch OLED Neon | Gaming | GamesZone Tunisie | 1690.00 | 6 |

## Stocks initiaux

| Entrepôt | Produits chargés |
|----------|------------------|
| Tunis Charguia | MSI Thin, ThinkPad, iPhone 15, Galaxy A55, PlayStation 5, Sony WH-1000XM5 |
| Sfax Poudrière | Galaxy A55, Samsung TV 55, LG OLED C3, JBL PartyBox, Lave-linge Samsung |
| Sousse Akouda | Canon EOS R50, Nintendo Switch OLED, HP LaserJet, Réfrigérateur LG, LG OLED C3 |
| Nabeul Mrezga | iPhone 15, PlayStation 5, JBL PartyBox, Galaxy A55 |

Chaque ligne de stock seedée reçoit trois mouvements historiques si aucun mouvement n'existe encore pour la paire produit/entrepôt :

1. Une entrée à J-6.
2. Une sortie à J-3.
3. Une entrée à J-1.

## Scénarios de démonstration

### Scénario `ADMIN`

1. Se connecter avec `admin@stockpro.local`.
2. Vérifier le dashboard global : valeur totale, saturation, alertes, tendances et benchmark entrepôts.
3. Ouvrir Utilisateurs pour confirmer les affectations par entrepôt.
4. Ouvrir Entrepôts, Produits, Stocks et Alertes pour vérifier la vision multi-entrepôts.

### Scénario `GESTIONNAIRE`

1. Se connecter avec `gestionnaire@stockpro.local`.
2. Vérifier que les listes Entrepôts, Stocks, Mouvements, Alertes et Dashboard ne contiennent que Tunis Charguia.
3. Créer une entrée de stock sur son entrepôt.
4. Tenter par API directe d'envoyer un `entrepotId` d'un autre entrepôt : la requête doit être refusée.

### Scénario `OBSERVATEUR`

1. Se connecter avec `observateur@stockpro.local`.
2. Vérifier que les formulaires et actions d'écriture ne sont pas affichés.
3. Consulter dashboard, stocks, mouvements et alertes en lecture seule.
4. Tenter un `POST /api/stocks` ou `POST /api/mouvements-stock` : la requête doit être refusée.
