import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, RouteConfigLoadEnd, RouteConfigLoadStart, Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet></router-outlet>

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
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 16px;
      background: rgba(23, 24, 43, 0.9);
      box-shadow: 0 18px 52px rgba(20, 20, 40, 0.28);
      color: #f5f7ff;
      font: 500 13px/1.3 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      backdrop-filter: blur(14px);
    }

    .route-loader__code {
      padding: 4px 7px;
      border-radius: 999px;
      background: #78a8ff;
      color: #081326;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 700;
      white-space: nowrap;
    }
  `]
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
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
