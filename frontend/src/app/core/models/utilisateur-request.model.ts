import { Role } from './role.model';

export type UtilisateurRequest = {
  nom: string;
  email: string;
  motDePasse: string | null;
  role: Role;
  entrepotNom: string | null;
};
