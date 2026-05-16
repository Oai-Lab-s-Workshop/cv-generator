import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TemplatePreviewList } from '../../shared/components/template-preview-list/template-preview-list';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-template-gallery-page',
  imports: [RouterLink, TemplatePreviewList],
  templateUrl: './template-gallery-page.html',
  styleUrls: ['../../styles/home-shared.css', './template-gallery-page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateGalleryPage {
  private readonly authService = inject(AuthService);

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly currentUser = this.authService.currentUser;
  readonly currentUserName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : 'Utilisateur authentifie';
  });
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
