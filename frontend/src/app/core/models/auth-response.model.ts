import { Utilisateur } from './utilisateur.model';

export type AuthResponse = {
  token: string;
  type: string;
  utilisateur: Utilisateur;
};
