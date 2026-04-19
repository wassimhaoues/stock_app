import { Role } from './role.model';

export type UtilisateurRequest = {
  nom: string;
  email: string;
  motDePasse: string | null;
  role: Role;
  entrepotId: number | null;
};
