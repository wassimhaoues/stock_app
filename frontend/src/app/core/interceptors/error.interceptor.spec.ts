import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let httpController: HttpTestingController;
  let snackBar: {
    open: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    snackBar = {
      open: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });

    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('shows a generic snackbar for network errors', () => {
    const http = TestBed.inject(HttpClient);

    http.get('/api/stocks').subscribe({ error: () => undefined });

    httpController.expectOne('/api/stocks').error(new ProgressEvent('Network error'));

    expect(snackBar.open).toHaveBeenCalledWith('Une erreur est survenue. Réessayez.', 'Fermer');
  });

  it('shows a generic snackbar for 5xx responses', () => {
    const http = TestBed.inject(HttpClient);

    http.get('/api/stocks').subscribe({ error: () => undefined });

    httpController.expectOne('/api/stocks').flush({}, { status: 500, statusText: 'Server Error' });

    expect(snackBar.open).toHaveBeenCalledWith('Une erreur est survenue. Réessayez.', 'Fermer');
  });

  it('does not handle 4xx responses', () => {
    const http = TestBed.inject(HttpClient);

    http.get('/api/stocks').subscribe({ error: () => undefined });

    httpController.expectOne('/api/stocks').flush({}, { status: 404, statusText: 'Not Found' });

    expect(snackBar.open).not.toHaveBeenCalled();
  });
});
