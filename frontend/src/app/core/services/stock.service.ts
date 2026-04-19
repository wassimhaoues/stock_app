import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { StockRequest } from '../models/stock-request.model';
import { Stock } from '../models/stock.model';

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly http = inject(HttpClient);

  findAll() {
    return this.http.get<Stock[]>('/api/stocks');
  }

  create(payload: StockRequest) {
    return this.http.post<Stock>('/api/stocks', payload);
  }

  update(id: number, payload: StockRequest) {
    return this.http.put<Stock>(`/api/stocks/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete<void>(`/api/stocks/${id}`);
  }
}
