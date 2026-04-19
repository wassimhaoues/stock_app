import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);

  const requestWithCredentials = request.url.startsWith('/api')
    ? request.clone({ withCredentials: true })
    : request;

  return next(requestWithCredentials).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !request.url.includes('/api/auth/login') &&
        !request.url.includes('/api/auth/me') &&
        !request.url.includes('/api/auth/logout')
      ) {
        authService.clearSession({ redirect: true });
      }

      return throwError(() => error);
    })
  );
};
