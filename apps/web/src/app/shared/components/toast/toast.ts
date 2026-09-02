import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    @for (message of toastService.messages(); track message.id) {
      <div class="toast toast--{{ message.tone }}" [attr.role]="message.tone === 'error' ? 'alert' : 'status'" (click)="toastService.dismiss(message.id)">
        <span class="toast__tone" aria-hidden="true">{{ labelFor(message.tone) }}</span>
        <span class="toast__text">{{ message.text }}</span>
        <button class="toast__close" type="button" aria-label="Fermer" (click)="toastService.dismiss(message.id); $event.stopPropagation()">
          Fermer
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
      gap: 12px;
      max-width: min(420px, calc(100vw - 36px));
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 15px 16px;
      border: 1px solid var(--af-encre);
      border-radius: 0;
      background: var(--af-planche);
      color: var(--af-encre);
      font: 500 14px/1.35 var(--af-corps);
      box-shadow: 6px 6px 0 var(--af-rouge);
      cursor: pointer;
      pointer-events: auto;
    }

    .toast--error { border-color: var(--af-rouge); }
    .toast__tone { flex: 0 0 auto; color: var(--af-bleu-encre); font: 600 10px/1 var(--af-mono); letter-spacing: .08em; text-transform: uppercase; }
    .toast--success .toast__tone { color: var(--af-vert); }
    .toast--error .toast__tone { color: var(--af-rouge-encre); }

    .toast__text {
      flex: 1 1 auto;
    }

    .toast__close {
      flex-shrink: 0;
      min-height: 44px;
      border: 1px solid var(--af-filet);
      border-radius: 0;
      background: transparent;
      color: var(--af-mine);
      cursor: pointer;
      padding: 0 10px;
      font: 600 10px/1 var(--af-mono);
      text-transform: uppercase;
    }

    .toast__close:hover {
      color: var(--af-encre);
    }

    @media print { :host { display: none !important; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  labelFor(tone: string): string {
    if (tone === 'success') return 'Validé';
    if (tone === 'error') return 'Erreur';
    return 'Info';
  }
}
