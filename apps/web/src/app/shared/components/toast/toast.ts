import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    @for (message of toastService.messages(); track message.id) {
      <div class="toast toast--{{ message.tone }}" role="alert" (click)="toastService.dismiss(message.id)">
        <i class="toast__icon bi {{ iconFor(message.tone) }}"></i>
        <span class="toast__text">{{ message.text }}</span>
        <button class="toast__close" type="button" aria-label="Fermer" (click)="toastService.dismiss(message.id); $event.stopPropagation()">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    }
  `,
  styles: [`
    :host {
      position: fixed;
      bottom: 18px;
      right: 18px;
      z-index: 10000;
      display: flex;
      flex-direction: column-reverse;
      gap: 10px;
      max-width: min(420px, calc(100vw - 36px));
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 14px;
      font: 500 14px/1.35 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 12px 40px rgba(20, 20, 40, 0.22);
      cursor: pointer;
      pointer-events: auto;
      animation: toast-in 0.25s ease-out;
    }

    .toast--success {
      background: #1a3a2a;
      color: #b5f0c5;
      border: 1px solid #3a6a4a;
    }

    .toast--error {
      background: #3a1a1a;
      color: #f0b5b5;
      border: 1px solid #6a3a3a;
    }

    .toast--info {
      background: #1a2a3a;
      color: #b5d0f0;
      border: 1px solid #3a4a6a;
    }

    .toast__icon {
      font-size: 18px;
      flex-shrink: 0;
    }

    .toast__text {
      flex: 1 1 auto;
    }

    .toast__close {
      flex-shrink: 0;
      border: 0;
      background: none;
      color: inherit;
      cursor: pointer;
      padding: 2px;
      opacity: 0.7;
      font-size: 12px;
    }

    .toast__close:hover {
      opacity: 1;
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  iconFor(tone: string): string {
    switch (tone) {
      case 'success':
        return 'bi-check-circle-fill';
      case 'error':
        return 'bi-exclamation-triangle-fill';
      default:
        return 'bi-info-circle-fill';
    }
  }
}
