import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

import { AuthResponse } from '../models/auth-response.model';
import { LoginRequest } from '../models/login-request.model';
import { Role } from '../models/role.model';
import { Utilisateur } from '../models/utilisateur.model';

const TOKEN_KEY = 'stockpro.token';
const USER_KEY = 'stockpro.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly tokenState = signal<string | null>(this.readToken());
  private readonly userState = signal<Utilisateur | null>(this.readUser());

  readonly token = this.tokenState.asReadonly();
  readonly currentUser = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.tokenState() && this.userState()));

  login(payload: LoginRequest) {
    return this.http.post<AuthResponse>('/api/auth/login', payload).pipe(
      tap((response) => {
        this.tokenState.set(response.token);
        this.userState.set(response.utilisateur);
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.utilisateur));
      }),
    );
  }

  logout(options?: { redirect?: boolean }) {
    this.tokenState.set(null);
    this.userState.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    if (options?.redirect ?? true) {
      void this.router.navigateByUrl('/login');
    }
  }

  hasRole(...roles: Role[]): boolean {
    const role = this.userState()?.role;
    return role ? roles.includes(role) : false;
  }

  private readToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private readUser(): Utilisateur | null {
    const rawUser = localStorage.getItem(USER_KEY);
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as Utilisateur;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}
