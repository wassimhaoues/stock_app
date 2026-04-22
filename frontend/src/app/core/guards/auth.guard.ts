import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService
    .ensureSession()
    .pipe(
      map((isAuthenticated): boolean | UrlTree =>
        isAuthenticated ? true : router.createUrlTree(['/login']),
      ),
    );
};
