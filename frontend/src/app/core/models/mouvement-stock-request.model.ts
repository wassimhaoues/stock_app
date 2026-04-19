import { TypeMouvement } from './type-mouvement.model';

export type MouvementStockRequest = {
  produitId: number;
  entrepotId: number;
  type: TypeMouvement;
  quantite: number;
};
