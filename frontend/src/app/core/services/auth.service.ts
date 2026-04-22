import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';

import { AuthResponse } from '../models/auth-response.model';
import { LoginRequest } from '../models/login-request.model';
import { Role } from '../models/role.model';
import { Utilisateur } from '../models/utilisateur.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly userState = signal<Utilisateur | null>(null);
  private readonly sessionCheckedState = signal(false);

  readonly currentUser = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.userState()));

  login(payload: LoginRequest) {
    return this.http.get<void>('/api/auth/csrf').pipe(
      switchMap(() => this.http.post<AuthResponse>('/api/auth/login', payload)),
      tap((response) => {
        this.userState.set(response.utilisateur);
        this.sessionCheckedState.set(true);
      }),
    );
  }

  logout(options?: { redirect?: boolean }) {
    const redirect = options?.redirect ?? true;
    this.clearSession();

    this.http
      .post<void>('/api/auth/logout', {})
      .pipe(catchError(() => of(undefined)))
      .subscribe(() => {
        if (redirect) {
          void this.router.navigateByUrl('/login');
        }
      });
  }

  ensureSession() {
    if (this.sessionCheckedState()) {
      return of(this.isAuthenticated());
    }

    return this.http.get<Utilisateur>('/api/auth/me').pipe(
      tap((user) => {
        this.userState.set(user);
        this.sessionCheckedState.set(true);
      }),
      map(() => true),
      catchError(() => {
        this.clearSession();
        this.sessionCheckedState.set(true);
        return of(false);
      }),
    );
  }

  clearSession(): void {
    this.userState.set(null);
    this.sessionCheckedState.set(false);
  }

  hasRole(...roles: Role[]): boolean {
    const role = this.userState()?.role;
    return role ? roles.includes(role) : false;
  }
}
