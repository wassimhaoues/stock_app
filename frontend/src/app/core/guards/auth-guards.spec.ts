import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';

import { Role } from '../models/role.model';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { roleGuard } from './role.guard';

describe('route guards', () => {
  let authService: {
    ensureSession: ReturnType<typeof vi.fn>;
    hasRole: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(() => {
    authService = {
      ensureSession: vi.fn(),
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
  ): boolean | UrlTree | Observable<boolean | UrlTree> {
    return TestBed.runInInjectionContext(() =>
      guard(route as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as boolean | UrlTree | Observable<boolean | UrlTree>;
  }

  async function runGuardResult(
    guard: CanActivateFn,
    route: Partial<ActivatedRouteSnapshot> = {},
  ): Promise<boolean | UrlTree> {
    const result = runGuard(guard, route);
    return result instanceof Observable ? firstValueFrom(result) : result;
  }

  function serialized(result: boolean | UrlTree): boolean | string {
    return result instanceof UrlTree ? router.serializeUrl(result) : result;
  }

  it('allows authenticated users through the auth guard', async () => {
    authService.ensureSession.mockReturnValue(of(true));

    expect(await runGuardResult(authGuard)).toBe(true);
  });

  it('redirects guests to login through the auth guard', async () => {
    authService.ensureSession.mockReturnValue(of(false));

    expect(serialized(await runGuardResult(authGuard))).toBe('/login');
  });

  it('keeps authenticated users away from the guest login route', async () => {
    authService.ensureSession.mockReturnValue(of(true));

    expect(serialized(await runGuardResult(guestGuard))).toBe('/');
  });

  it('allows unauthenticated users to reach the guest login route', async () => {
    authService.ensureSession.mockReturnValue(of(false));

    expect(await runGuardResult(guestGuard)).toBe(true);
  });

  it('redirects unauthenticated users before checking roles', async () => {
    authService.ensureSession.mockReturnValue(of(false));

    expect(
      serialized(await runGuardResult(roleGuard, { data: { roles: ['ADMIN'] satisfies Role[] } })),
    ).toBe('/login');
    expect(authService.hasRole).not.toHaveBeenCalled();
  });

  it('allows users with an accepted role through the role guard', async () => {
    authService.ensureSession.mockReturnValue(of(true));
    authService.hasRole.mockReturnValue(true);

    expect(await runGuardResult(roleGuard, { data: { roles: ['ADMIN'] satisfies Role[] } })).toBe(
      true,
    );
    expect(authService.hasRole).toHaveBeenCalledWith('ADMIN');
  });

  it('redirects authenticated users without the accepted role', async () => {
    authService.ensureSession.mockReturnValue(of(true));
    authService.hasRole.mockReturnValue(false);

    expect(
      serialized(await runGuardResult(roleGuard, { data: { roles: ['ADMIN'] satisfies Role[] } })),
    ).toBe('/');
  });
});
