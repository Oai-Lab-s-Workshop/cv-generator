import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, RouteConfigLoadEnd, RouteConfigLoadStart, Router, RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

import { ToastComponent } from './shared/components/toast/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `
    <router-outlet></router-outlet>

    <app-toast></app-toast>

    @if (loadingCode()) {
      <aside class="route-loader" aria-live="polite" aria-label="Chargement">
        <span class="route-loader__code">{{ loadingCode() }}</span>
        <span>{{ loadingMessage() }}</span>
      </aside>
    }
  `,
  styles: [`
    .route-loader {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 9999;
      display: flex;
      gap: 10px;
      align-items: center;
      max-width: min(360px, calc(100vw - 36px));
      padding: 12px 14px;
      border: 1px solid var(--af-filet);
      border-top: 3px solid var(--af-encre);
      border-radius: 0;
      background: var(--af-planche);
      box-shadow: 6px 6px 0 var(--af-rouge);
      color: var(--af-encre);
      font: 500 13px/1.3 var(--af-corps);
    }

    .route-loader__code {
      padding: 4px 7px;
      border: 1px solid var(--af-bleu);
      border-radius: 0;
      color: var(--af-bleu-encre);
      font-family: var(--af-mono);
      font-weight: 700;
      white-space: nowrap;
    }

    @media print { .route-loader { display: none !important; } }
  `]
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly themeService = inject(ThemeService);
  private lazyLoadDepth = 0;
  private clearLoadingTimer: number | undefined;

  readonly loadingCode = signal<string | null>(null);
  readonly loadingMessage = signal('');

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.setLoading('NG-010', 'Plotting the route');
        return;
      }

      if (event instanceof RouteConfigLoadStart) {
        this.lazyLoadDepth += 1;
        this.setLoading('NG-020', 'Fetching the page module');
        return;
      }

      if (event instanceof RouteConfigLoadEnd) {
        this.lazyLoadDepth = Math.max(0, this.lazyLoadDepth - 1);
        if (this.lazyLoadDepth === 0) {
          this.setLoading('NG-030', 'Painting the screen');
        }
        return;
      }

      if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.lazyLoadDepth = 0;
        this.clearLoadingSoon();
      }
    });
  }

  private setLoading(code: string, message: string): void {
    window.clearTimeout(this.clearLoadingTimer);
    this.loadingCode.set(code);
    this.loadingMessage.set(message);
  }

  private clearLoadingSoon(): void {
    window.clearTimeout(this.clearLoadingTimer);
    this.clearLoadingTimer = window.setTimeout(() => {
      this.loadingCode.set(null);
      this.loadingMessage.set('');
    }, 250);
  }
}
