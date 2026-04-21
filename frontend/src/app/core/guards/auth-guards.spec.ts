import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { Role } from '../models/role.model';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { roleGuard } from './role.guard';

describe('route guards', () => {
  let authService: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    hasRole: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(() => {
    authService = {
      isAuthenticated: vi.fn(),
      hasRole: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    });

    router = TestBed.inject(Router);
  });

  function runGuard(
    guard: CanActivateFn,
    route: Partial<ActivatedRouteSnapshot> = {},
  ): boolean | UrlTree {
    return TestBed.runInInjectionContext(() =>
      guard(route as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as boolean | UrlTree;
  }

  function serialized(result: boolean | UrlTree): boolean | string {
    return result instanceof UrlTree ? router.serializeUrl(result) : result;
  }

  it('allows authenticated users through the auth guard', () => {
    authService.isAuthenticated.mockReturnValue(true);

    expect(runGuard(authGuard)).toBe(true);
  });

  it('redirects guests to login through the auth guard', () => {
    authService.isAuthenticated.mockReturnValue(false);

    expect(serialized(runGuard(authGuard))).toBe('/login');
  });

  it('keeps authenticated users away from the guest login route', () => {
    authService.isAuthenticated.mockReturnValue(true);

    expect(serialized(runGuard(guestGuard))).toBe('/');
  });

  it('allows users with an accepted role through the role guard', () => {
    authService.isAuthenticated.mockReturnValue(true);
    authService.hasRole.mockReturnValue(true);

    expect(runGuard(roleGuard, { data: { roles: ['ADMIN'] satisfies Role[] } })).toBe(true);
    expect(authService.hasRole).toHaveBeenCalledWith('ADMIN');
  });

  it('redirects authenticated users without the accepted role', () => {
    authService.isAuthenticated.mockReturnValue(true);
    authService.hasRole.mockReturnValue(false);

    expect(serialized(runGuard(roleGuard, { data: { roles: ['ADMIN'] satisfies Role[] } }))).toBe(
      '/',
    );
  });
});
