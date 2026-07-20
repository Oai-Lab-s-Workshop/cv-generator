import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly isAuthenticated = this.authService.isAuthenticated ?? computed(() => Boolean(this.authService.currentUser()));
  readonly bugReportUrl = signal(environment.bugReportUrl);
  readonly isLoggingOut = signal(false);

  constructor() {
    void this.loadRuntimeConfig();
  }

  logout(): void {
    this.isLoggingOut.set(true);
    this.authService.logout();
    window.setTimeout(() => {
      window.location.assign('/login');
    }, 300);
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
