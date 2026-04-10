import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-root-redirect-page',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RootRedirectPage {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  constructor() {
    void this.router.navigateByUrl(this.authService.isAuthenticated() ? '/home' : '/login', {
      replaceUrl: true,
    });
  }
}
