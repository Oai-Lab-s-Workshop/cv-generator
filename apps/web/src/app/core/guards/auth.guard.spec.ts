import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard, guestOnlyGuard } from './auth.guard';

class AuthServiceStub {
  authenticated = false;

  readonly isAuthenticated = () => this.authenticated;
}

describe('authGuard', () => {
  let authService: AuthServiceStub;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useClass: AuthServiceStub },
      ],
    });

    authService = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    router = TestBed.inject(Router);
  });

  it('allows access when the user is authenticated', () => {
    authService.authenticated = true;

    const result = runGuard('/home');

    expect(result).toBe(true);
  });

  it('redirects to login when the user is not authenticated', () => {
    authService.authenticated = false;

    const result = runGuard('/home');

    expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fhome');
  });

  function runGuard(url: string): boolean | UrlTree {
    const route = {} as ActivatedRouteSnapshot;
    const state = { url } as RouterStateSnapshot;

    return TestBed.runInInjectionContext(() => authGuard(route, state)) as boolean | UrlTree;
  }
});

describe('guestOnlyGuard', () => {
  let authService: AuthServiceStub;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useClass: AuthServiceStub },
      ],
    });

    authService = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    router = TestBed.inject(Router);
  });

  it('allows access when the user is not authenticated', () => {
    authService.authenticated = false;

    const result = runGuard();

    expect(result).toBe(true);
  });

  it('redirects to home when the user is authenticated', () => {
    authService.authenticated = true;

    const result = runGuard();

    expect(router.serializeUrl(result as UrlTree)).toBe('/home');
  });

  function runGuard(): boolean | UrlTree {
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    return TestBed.runInInjectionContext(() => guestOnlyGuard(route, state)) as boolean | UrlTree;
  }
});
