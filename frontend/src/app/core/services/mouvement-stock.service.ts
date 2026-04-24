import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { MouvementStockRequest } from '../models/mouvement-stock-request.model';
import { MouvementStock } from '../models/mouvement-stock.model';
import { PagedResponse } from '../models/paged-response.model';

@Injectable({ providedIn: 'root' })
export class MouvementStockService {
  private readonly http = inject(HttpClient);

  findAll(page = 0, size = 20) {
    return this.http.get<PagedResponse<MouvementStock>>('/api/mouvements-stock', {
      params: {
        page,
        size,
        sort: 'date,desc',
      },
    });
  }

  create(payload: MouvementStockRequest) {
    return this.http.post<MouvementStock>('/api/mouvements-stock', payload);
  }
}
