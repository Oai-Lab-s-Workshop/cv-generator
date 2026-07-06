import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PocketBaseService } from '../services/pocketbase.service';
import { CvProfile } from '../models/cv-profile.model';
import { cvAccessGuard } from './cv-access.guard';

class AuthServiceStub {
  authenticated = false;
  currentUserId: string | null = null;

  readonly isAuthenticated = () => this.authenticated;

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }
}

class PocketBaseServiceStub {
  profile: CvProfile | null = null;
  errorStatus: number | null = null;

  async getCvProfileBySlug(): Promise<CvProfile> {
    if (this.errorStatus) {
      throw { status: this.errorStatus };
    }

    if (!this.profile) {
      throw { status: 404 };
    }

    return this.profile;
  }
}

describe('cvAccessGuard', () => {
  let authService: AuthServiceStub;
  let pocketBaseService: PocketBaseServiceStub;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: PocketBaseService, useClass: PocketBaseServiceStub },
      ],
    });

    authService = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    pocketBaseService = TestBed.inject(PocketBaseService) as unknown as PocketBaseServiceStub;
    router = TestBed.inject(Router);
  });

  it('redirects unauthenticated unknown slugs to not-found', async () => {
    const result = await runGuard('missing-slug');

    expect(router.serializeUrl(result as UrlTree)).toBe('/not-found?returnUrl=%2Fmissing-slug');
  });

  it('redirects authenticated unknown slugs to not-found', async () => {
    authService.authenticated = true;

    const result = await runGuard('missing-slug');

    expect(router.serializeUrl(result as UrlTree)).toBe('/not-found?returnUrl=%2Fmissing-slug');
  });

  it('allows valid public CV slugs', async () => {
    pocketBaseService.profile = createProfile({ public: true });

    await expect(runGuard('valid-slug')).resolves.toBe(true);
  });

  it('allows missing slug routes without loading a profile', async () => {
    const result = await runGuard(null);

    expect(result).toBe(true);
  });

  it('redirects anonymous users away from private profiles', async () => {
    pocketBaseService.errorStatus = 401;

    const result = await runGuard('private-slug');

    expect(router.serializeUrl(result as UrlTree)).toBe('/not-found?returnUrl=%2Fprivate-slug');
  });

  it('redirects authenticated non-owners away from private profiles', async () => {
    authService.authenticated = true;
    authService.currentUserId = 'another-user';
    pocketBaseService.errorStatus = 403;

    const result = await runGuard('private-slug');

    expect(router.serializeUrl(result as UrlTree)).toBe('/home');
  });

  it('allows private profile owners', async () => {
    authService.authenticated = true;
    authService.currentUserId = 'user-id';
    pocketBaseService.profile = createProfile({ public: false, user: 'user-id' });

    await expect(runGuard('private-slug')).resolves.toBe(true);
  });

  it('allows public profile owners', async () => {
    authService.authenticated = true;
    authService.currentUserId = 'user-id';
    pocketBaseService.profile = createProfile({ public: true, user: 'user-id' });

    await expect(runGuard('public-slug')).resolves.toBe(true);
  });

  function runGuard(slug: string | null): Promise<boolean | UrlTree> {
    const route = {
      paramMap: { get: () => slug },
    } as unknown as ActivatedRouteSnapshot;
    const state = { url: `/${slug}` } as RouterStateSnapshot;

    return TestBed.runInInjectionContext(() => cvAccessGuard(route, state)) as Promise<boolean | UrlTree>;
  }

  function createProfile(overrides: Partial<CvProfile> = {}): CvProfile {
    return {
      id: 'profile-id',
      slug: 'valid-slug',
      profileName: 'Valid Profile',
      public: true,
      user: 'user-id',
      ...overrides,
    };
  }
});
