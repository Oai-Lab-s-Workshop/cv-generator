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

  async getCvProfileBySlug(): Promise<CvProfile> {
    if (!this.profile) {
      throw new Error('not found');
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

  it('redirects unauthenticated unknown slugs to login', async () => {
    const result = await runGuard('missing-slug');

    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('redirects authenticated unknown slugs to home', async () => {
    authService.authenticated = true;

    const result = await runGuard('missing-slug');

    expect(router.serializeUrl(result as UrlTree)).toBe('/home');
  });

  it('allows valid public CV slugs', async () => {
    pocketBaseService.profile = createProfile({ public: true });

    await expect(runGuard('valid-slug')).resolves.toBe(true);
  });

  function runGuard(slug: string): Promise<boolean | UrlTree> {
    const route = {
      paramMap: new Map([['slug', slug]]),
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
