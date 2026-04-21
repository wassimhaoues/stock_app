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
    token: 'jwt-token',
    type: 'Bearer',
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

  it('stores the token and user after login', () => {
    service.login(credentials).subscribe((response) => {
      expect(response).toEqual(authResponse);
      expect(service.token()).toBe('jwt-token');
      expect(service.currentUser()).toEqual(utilisateur);
      expect(service.isAuthenticated()).toBe(true);
      expect(localStorage.getItem('stockpro.token')).toBe('jwt-token');
      expect(localStorage.getItem('stockpro.user')).toBe(JSON.stringify(utilisateur));
    });

    const request = httpController.expectOne('/api/auth/login');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(credentials);

    request.flush(authResponse);
  });

  it('clears the session and redirects on logout', () => {
    service.login(credentials).subscribe();
    httpController.expectOne('/api/auth/login').flush(authResponse);

    service.logout();

    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('stockpro.token')).toBeNull();
    expect(localStorage.getItem('stockpro.user')).toBeNull();
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
