import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  private readonly authService = inject(AuthService);

  readonly isAuthenticated = this.authService.isAuthenticated ?? computed(() => Boolean(this.authService.currentUser()));
  readonly bugReportUrl = signal(environment.bugReportUrl);

  constructor() {
    void this.loadRuntimeConfig();
  }

  logout(): void {
    this.authService.logout();
    window.location.assign('/login');
  }

  private async loadRuntimeConfig(): Promise<void> {
    try {
      const response = await fetch('/assets/runtime-config.json', { cache: 'no-store' });

      if (!response.ok) {
        return;
      }

      const config = (await response.json()) as { bugReportUrl?: unknown };
      if (typeof config.bugReportUrl === 'string' && config.bugReportUrl.trim()) {
        this.bugReportUrl.set(config.bugReportUrl.trim());
      }
    } catch {
      // Runtime config is optional outside Docker.
    }
  }
}
