import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthResponse } from '../models/auth-response.model';
import { LoginRequest } from '../models/login-request.model';
import { Utilisateur } from '../models/utilisateur.model';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const utilisateur: Utilisateur = {
    id: 1,
    nom: 'Admin StockPro',
    email: 'admin@stockpro.test',
    role: 'ADMIN',
    entrepotId: null,
    entrepotNom: null,
  };
  const authResponse: AuthResponse = {
    utilisateur,
  };
  const credentials: LoginRequest = {
    email: 'admin@stockpro.test',
    motDePasse: 'secret',
  };

  let httpController: HttpTestingController;
  let navigateByUrl: ReturnType<typeof vi.fn>;
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    navigateByUrl = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: { navigateByUrl },
        },
      ],
    });

    httpController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpController.verify();
    localStorage.clear();
  });

  it('loads CSRF, logs in, and keeps only the user in memory', () => {
    service.login(credentials).subscribe((response) => {
      expect(response).toEqual(authResponse);
      expect(service.currentUser()).toEqual(utilisateur);
      expect(service.isAuthenticated()).toBe(true);
      expect(localStorage.length).toBe(0);
    });

    const csrfRequest = httpController.expectOne('/api/auth/csrf');
    expect(csrfRequest.request.method).toBe('GET');
    csrfRequest.flush(null);

    const loginRequest = httpController.expectOne('/api/auth/login');
    expect(loginRequest.request.method).toBe('POST');
    expect(loginRequest.request.body).toEqual(credentials);

    loginRequest.flush(authResponse);
  });

  it('clears the session, calls backend logout, and redirects on logout', () => {
    service.login(credentials).subscribe();
    httpController.expectOne('/api/auth/csrf').flush(null);
    httpController.expectOne('/api/auth/login').flush(authResponse);

    service.logout();

    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);

    const logoutRequest = httpController.expectOne('/api/auth/logout');
    expect(logoutRequest.request.method).toBe('POST');
    logoutRequest.flush(null);

    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('restores the session from the backend current-user endpoint', () => {
    service.ensureSession().subscribe((isAuthenticated) => {
      expect(isAuthenticated).toBe(true);
      expect(service.currentUser()).toEqual(utilisateur);
      expect(service.isAuthenticated()).toBe(true);
    });

    const request = httpController.expectOne('/api/auth/me');
    expect(request.request.method).toBe('GET');
    request.flush(utilisateur);
  });

  it('clears memory state when session restore fails', () => {
    service.ensureSession().subscribe((isAuthenticated) => {
      expect(isAuthenticated).toBe(false);
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    httpController.expectOne('/api/auth/me').flush({}, { status: 401, statusText: 'Unauthorized' });
  });
});
