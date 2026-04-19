import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';

import { AuthResponse } from '../models/auth-response.model';
import { LoginRequest } from '../models/login-request.model';
import { Role } from '../models/role.model';
import { Utilisateur } from '../models/utilisateur.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly userState = signal<Utilisateur | null>(null);
  private sessionLoaded = false;

  readonly currentUser = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.userState()));

  login(payload: LoginRequest) {
    return this.http.post<AuthResponse>('/api/auth/login', payload, { withCredentials: true }).pipe(
      tap((response) => {
        this.userState.set(response.utilisateur);
        this.sessionLoaded = true;
      })
    );
  }

  logout(options?: { redirect?: boolean }) {
    this.http.post<void>('/api/auth/logout', null, { withCredentials: true }).subscribe({
      next: () => this.clearSession(options),
      error: () => this.clearSession(options),
    });
  }

  loadSession(): Observable<boolean> {
    if (this.isAuthenticated()) {
      return of(true);
    }

    if (this.sessionLoaded) {
      return of(false);
    }

    return this.http.get<AuthResponse>('/api/auth/me', { withCredentials: true }).pipe(
      tap((response) => {
        this.userState.set(response.utilisateur);
        this.sessionLoaded = true;
      }),
      map(() => true),
      catchError(() => {
        this.clearSession({ redirect: false });
        return of(false);
      })
    );
  }

  clearSession(options?: { redirect?: boolean }) {
    this.userState.set(null);
    this.sessionLoaded = true;

    if (options?.redirect ?? true) {
      void this.router.navigateByUrl('/login');
    }
  }

  hasRole(...roles: Role[]): boolean {
    const role = this.userState()?.role;
    return role ? roles.includes(role) : false;
  }
}
