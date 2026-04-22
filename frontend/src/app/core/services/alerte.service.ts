import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Alerte } from '../models/alerte.model';

@Injectable({ providedIn: 'root' })
export class AlerteService {
  private readonly http = inject(HttpClient);

  findAll() {
    return this.http.get<Alerte[]>('/api/alertes');
  }
}
