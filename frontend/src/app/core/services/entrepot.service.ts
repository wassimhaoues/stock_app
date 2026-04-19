import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { EntrepotRequest } from '../models/entrepot-request.model';
import { Entrepot } from '../models/entrepot.model';

@Injectable({ providedIn: 'root' })
export class EntrepotService {
  private readonly http = inject(HttpClient);

  findAll() {
    return this.http.get<Entrepot[]>('/api/entrepots');
  }

  create(payload: EntrepotRequest) {
    return this.http.post<Entrepot>('/api/entrepots', payload);
  }

  update(id: number, payload: EntrepotRequest) {
    return this.http.put<Entrepot>(`/api/entrepots/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete<void>(`/api/entrepots/${id}`);
  }
}
