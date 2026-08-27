import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly themeService = inject(ThemeService);

  readonly isAuthenticated = this.authService.isAuthenticated ?? computed(() => Boolean(this.authService.currentUser()));
  readonly bugReportUrl = signal(environment.bugReportUrl);
  readonly isLoggingOut = signal(false);
  readonly menuOpen = signal(false);

  constructor() {
    void this.loadRuntimeConfig();
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.closeMenu());
  }

  toggleTheme(): void { this.themeService.toggle(); }
  toggleMenu(): void { this.menuOpen.update((open) => !open); }
  closeMenu(): void { this.menuOpen.set(false); }

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
