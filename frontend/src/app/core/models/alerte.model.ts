export type Alerte = {
  stockId: number;
  produitId: number;
  produitNom: string;
  entrepotId: number;
  entrepotNom: string;
  quantite: number;
  seuilAlerte: number;
  manque: number;
  priorite: string;
  actionAttendue: string;
};
