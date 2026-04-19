import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { MouvementStockRequest } from '../models/mouvement-stock-request.model';
import { MouvementStock } from '../models/mouvement-stock.model';

@Injectable({ providedIn: 'root' })
export class MouvementStockService {
  private readonly http = inject(HttpClient);

  findAll() {
    return this.http.get<MouvementStock[]>('/api/mouvements-stock');
  }

  create(payload: MouvementStockRequest) {
    return this.http.post<MouvementStock>('/api/mouvements-stock', payload);
  }
}
