import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { UtilisateurRequest } from '../models/utilisateur-request.model';
import { Utilisateur } from '../models/utilisateur.model';

@Injectable({ providedIn: 'root' })
export class UtilisateurService {
  private readonly http = inject(HttpClient);

  findAll() {
    return this.http.get<Utilisateur[]>('/api/utilisateurs');
  }

  create(payload: UtilisateurRequest) {
    return this.http.post<Utilisateur>('/api/utilisateurs', payload);
  }

  update(id: number, payload: UtilisateurRequest) {
    return this.http.put<Utilisateur>(`/api/utilisateurs/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete<void>(`/api/utilisateurs/${id}`);
  }
}
