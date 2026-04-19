import { TypeMouvement } from './type-mouvement.model';

export type MouvementStock = {
  id: number;
  produitId: number;
  produitNom: string;
  entrepotId: number;
  entrepotNom: string;
  type: TypeMouvement;
  quantite: number;
  date: string;
};
