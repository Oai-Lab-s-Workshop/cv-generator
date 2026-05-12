import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { resolveDesktopRuntimeConfig } from '../../core/utils/desktop-runtime-config';

type ServiceStatus = 'checking' | 'running' | 'unavailable';

@Component({
  selector: 'app-desktop-home-page',
  imports: [RouterLink],
  templateUrl: './desktop-home-page.html',
  styleUrl: './desktop-home-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesktopHomePage {
  readonly config = resolveDesktopRuntimeConfig();
  readonly pocketBaseStatus = signal<ServiceStatus>('checking');
  readonly mcpStatus = signal<ServiceStatus>('checking');
  readonly isPasswordVisible = signal(false);
  readonly copyMessage = signal<string | null>(null);
  readonly pocketBaseAdminUrl = computed(() => this.config?.pocketbaseAdminUrl ?? `${this.config?.pocketbaseUrl ?? ''}/_/`);

  constructor() {
    void this.refreshStatus();
  }

  async refreshStatus(): Promise<void> {
    this.pocketBaseStatus.set('checking');
    this.mcpStatus.set('checking');

    const [pocketBaseStatus, mcpStatus] = await Promise.all([
      this.checkUrl(`${this.config?.pocketbaseUrl ?? ''}/api/health`),
      this.checkUrl(this.config?.mcpHealthUrl),
    ]);

    this.pocketBaseStatus.set(pocketBaseStatus);
    this.mcpStatus.set(mcpStatus);
  }

  async copy(text: string | undefined, label: string): Promise<void> {
    if (!text) {
      return;
    }

    await navigator.clipboard.writeText(text);
    this.copyMessage.set(`${label} copie.`);
    window.setTimeout(() => this.copyMessage.set(null), 2_500);
  }

  statusLabel(status: ServiceStatus): string {
    switch (status) {
      case 'checking':
        return 'Verification...';
      case 'running':
        return 'Running';
      case 'unavailable':
        return 'Unavailable';
    }
  }

  private async checkUrl(url: string | undefined): Promise<ServiceStatus> {
    if (!url) {
      return 'unavailable';
    }

    try {
      const response = await fetch(url, { cache: 'no-store' });
      return response.ok ? 'running' : 'unavailable';
    } catch {
      return 'unavailable';
    }
  }
}
