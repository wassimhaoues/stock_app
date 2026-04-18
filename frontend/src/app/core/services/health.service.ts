import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { HealthStatus } from '../models/health-status.model';

@Injectable({
  providedIn: 'root',
})
export class HealthService {
  private readonly http = inject(HttpClient);

  getHealth(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>('/api/health');
  }
}
