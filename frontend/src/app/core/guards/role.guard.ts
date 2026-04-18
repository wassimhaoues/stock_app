import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from '@angular/router';

import { Role } from '../models/role.model';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const roles = (route.data['roles'] as Role[] | undefined) ?? [];

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  return authService.hasRole(...roles) ? true : router.createUrlTree(['/']);
};
