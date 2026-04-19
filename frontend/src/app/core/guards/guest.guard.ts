import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { map, Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (): boolean | UrlTree | Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService
    .loadSession()
    .pipe(map((isAuthenticated) => (isAuthenticated ? router.createUrlTree(['/']) : true)));
};
