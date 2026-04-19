import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { ProduitRequest } from '../models/produit-request.model';
import { Produit } from '../models/produit.model';

@Injectable({ providedIn: 'root' })
export class ProduitService {
  private readonly http = inject(HttpClient);

  findAll() {
    return this.http.get<Produit[]>('/api/produits');
  }

  create(payload: ProduitRequest) {
    return this.http.post<Produit>('/api/produits', payload);
  }

  update(id: number, payload: ProduitRequest) {
    return this.http.put<Produit>(`/api/produits/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete<void>(`/api/produits/${id}`);
  }
}
