import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import {
  AdminAnalytics,
  DashboardAnalytics,
  DashboardKpis,
  DashboardStats,
} from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getStats() {
    return this.http.get<DashboardStats>('/api/dashboard/stats');
  }

  getKpis() {
    return this.http.get<DashboardKpis>('/api/dashboard/kpis');
  }

  getAnalytics() {
    return this.http.get<DashboardAnalytics>('/api/dashboard/analytics');
  }

  getAdminAnalytics() {
    return this.http.get<AdminAnalytics>('/api/dashboard/admin/analytics');
  }
}
