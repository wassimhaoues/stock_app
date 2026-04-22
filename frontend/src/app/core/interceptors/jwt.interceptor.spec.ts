import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { jwtInterceptor } from './jwt.interceptor';

describe('jwtInterceptor', () => {
  let httpController: HttpTestingController;
  let authService: {
    clearSession: ReturnType<typeof vi.fn>;
  };
  let navigateByUrl: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    authService = {
      clearSession: vi.fn(),
    };
    navigateByUrl = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });

    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('sends API requests with credentials and without an Authorization header', () => {
    const http = TestBed.inject(HttpClient);

    http.get('/api/stocks').subscribe();

    const request = httpController.expectOne('/api/stocks');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
  });

  it('clears local auth state and redirects on protected API 401 responses', () => {
    const http = TestBed.inject(HttpClient);

    http.get('/api/stocks').subscribe({ error: () => undefined });

    httpController.expectOne('/api/stocks').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authService.clearSession).toHaveBeenCalled();
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
