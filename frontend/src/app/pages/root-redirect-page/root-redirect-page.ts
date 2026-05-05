import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { isDesktopMode } from '../../core/utils/desktop-runtime-config';

@Component({
  selector: 'app-root-redirect-page',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RootRedirectPage {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  constructor() {
    if (isDesktopMode()) {
      void this.router.navigateByUrl('/desktop', { replaceUrl: true });
      return;
    }

    void this.router.navigateByUrl(this.authService.isAuthenticated() ? '/home' : '/login', {
      replaceUrl: true,
    });
  }
}
