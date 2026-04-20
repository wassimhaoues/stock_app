export type DashboardStats = {
  totalEntrepots: number;
  totalProduitsCatalogue: number;
  totalStocks: number;
  totalMouvements: number;
  valeurTotaleStock: number;
  totalAlertes: number;
  capaciteUtilisee: number;
  capaciteDisponible: number;
  tauxSaturationGlobal: number;
};

export type DashboardKpis = {
  valeurTotaleStock: number;
  produitsActifs: number;
  produitsSousSeuilCritique: number;
  tauxRisqueRupture: number;
  entreesJour: number;
  sortiesJour: number;
  entreesSemaine: number;
  sortiesSemaine: number;
  entreesMois: number;
  sortiesMois: number;
  stocksDormants: number;
  couvertureStockJoursEstimee: number | null;
  valeurStockParEntrepot: WarehouseValueKpi[];
  capaciteParEntrepot: WarehouseCapacityKpi[];
};

export type WarehouseValueKpi = {
  entrepotId: number;
  entrepotNom: string;
  valeurStock: number;
};

export type WarehouseCapacityKpi = {
  entrepotId: number;
  entrepotNom: string;
  capacite: number;
  capaciteUtilisee: number;
  capaciteDisponible: number;
  tauxSaturation: number;
};

export type DashboardAnalytics = {
  mouvementsParJour: MovementTrendPoint[];
  repartitionParEntrepot: WarehouseDistributionItem[];
  topProduitsMouvementes: TopProductMovementItem[];
  stocksDormants: DormantStockItem[];
  alertesParGravite: AlertSeverityItem[];
  entrepotsActifs: WarehouseActivityItem[];
};

export type MovementTrendPoint = {
  date: string;
  entrees: number;
  sorties: number;
};

export type WarehouseDistributionItem = {
  entrepotId: number;
  entrepotNom: string;
  quantiteStock: number;
  valeurStock: number;
  alertes: number;
  tauxSaturation: number;
};

export type TopProductMovementItem = {
  produitId: number;
  produitNom: string;
  quantiteMouvementee: number;
  valeurStock: number;
};

export type DormantStockItem = {
  stockId: number;
  produitNom: string;
  entrepotNom: string;
  quantite: number;
  joursSansMouvement: number;
};

export type AlertSeverityItem = {
  priorite: string;
  total: number;
};

export type WarehouseActivityItem = {
  entrepotId: number;
  entrepotNom: string;
  quantiteMouvementee: number;
  totalMouvements: number;
};

export type AdminAnalytics = {
  valeurMoyenneParEntrepot: number;
  entrepotsEnRisqueCapacite: number;
  performanceEntrepots: WarehouseBenchmarkItem[];
};

export type WarehouseBenchmarkItem = {
  entrepotId: number;
  entrepotNom: string;
  valeurStock: number;
  mouvementsMois: number;
  alertes: number;
  tauxSaturation: number;
};
