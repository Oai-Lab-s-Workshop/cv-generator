import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PocketBaseService } from '../services/pocketbase.service';

export const cvAccessGuard: CanActivateFn = async (route, state) => {
  const pocketBaseService = inject(PocketBaseService);
  const authService = inject(AuthService);
  const router = inject(Router);
  const slug = route.paramMap.get('slug');

  if (!slug) {
    return true;
  }

  try {
    const profile = await pocketBaseService.getCvProfileBySlug(slug);
    const isPublic = profile.public !== false;

    if (isPublic) {
      return true;
    }

    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    if (authService.getCurrentUserId() !== profile.user) {
      return router.createUrlTree(['/home']);
    }

    return true;
  } catch (error: unknown) {
    const status = getErrorStatus(error);

    if (status === 401) {
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    if (status === 403) {
      return router.createUrlTree(['/home']);
    }

    if (status === 404) {
      return true;
    }

    return authService.isAuthenticated() ? router.createUrlTree(['/home']) : true;
  }
};

function getErrorStatus(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const status = (error as { status?: unknown }).status;

  return typeof status === 'number' ? status : null;
}
