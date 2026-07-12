import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-help-modal',
  standalone: true,
  templateUrl: './help-modal.html',
  styleUrl: './help-modal.css',
})
export class HelpModalComponent {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.close.emit();
  }

  onBackdropClick(): void {
    this.close.emit();
  }

  onPanelClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}
