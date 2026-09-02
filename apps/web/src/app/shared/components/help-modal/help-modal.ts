import { AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';

@Component({
  selector: 'app-help-modal',
  standalone: true,
  templateUrl: './help-modal.html',
  styleUrl: './help-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpModalComponent implements AfterViewChecked, OnChanges, OnDestroy {
  @ViewChild('panel') private panel?: ElementRef<HTMLElement>;
  @ViewChild('initialFocus') private initialFocus?: ElementRef<HTMLButtonElement>;
  @Input() open = false;
  @Output() close = new EventEmitter<void>();
  private previouslyFocused: HTMLElement | null = null;
  private focusInitialized = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['open']) return;
    if (this.open) {
      this.previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.focusInitialized = false;
    } else {
      this.restoreFocus();
    }
  }

  ngAfterViewChecked(): void {
    if (this.open && !this.focusInitialized && this.panel) {
      this.focusInitialized = true;
      this.initialFocus?.nativeElement.focus();
    }
  }

  ngOnDestroy(): void { this.restoreFocus(); }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.requestClose();
      return;
    }
    if (event.key !== 'Tab' || !this.panel) return;

    const focusable = Array.from(this.panel.nativeElement.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter((element) => !element.hasAttribute('disabled'));
    if (!focusable.length) {
      event.preventDefault();
      this.panel.nativeElement.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  onBackdropClick(): void {
    this.requestClose();
  }

  onPanelClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  requestClose(): void {
    this.close.emit();
    queueMicrotask(() => this.restoreFocus());
  }

  private restoreFocus(): void {
    this.previouslyFocused?.focus();
    this.previouslyFocused = null;
    this.focusInitialized = false;
  }
}
