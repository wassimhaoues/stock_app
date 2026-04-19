export type Stock = {
  id: number;
  produitId: number;
  produitNom: string;
  entrepotId: number;
  entrepotNom: string;
  quantite: number;
  seuilAlerte: number;
  enAlerte: boolean;
};
