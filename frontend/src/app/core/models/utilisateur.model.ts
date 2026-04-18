import { Role } from './role.model';

export type Utilisateur = {
  id: number;
  nom: string;
  email: string;
  role: Role;
};
