import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[appTooltip]',
})
export class TooltipDirective {
  @Input('appTooltip') content = '';
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

  private tooltipEl: HTMLElement | null = null;
  private showTimeout: ReturnType<typeof setTimeout> | null = null;
  private unlistenDestroy: (() => void) | null = null;

  constructor(
    private host: ElementRef<HTMLElement>,
    private renderer: Renderer2,
  ) {}

  private show(): void {
    if (this.tooltipEl || !this.content?.trim()) return;

    this.showTimeout = setTimeout(() => {
      this.createTooltip();
    }, 300);
  }

  private hide(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    this.destroyTooltip();
  }

  private createTooltip(): void {
    const el = this.renderer.createElement('div');
    this.renderer.addClass(el, 'app-tooltip');
    this.renderer.appendChild(el, this.renderer.createText(this.content));

    this.renderer.appendChild(document.body, el);
    this.tooltipEl = el;

    this.positionTooltip();

    this.unlistenDestroy = this.renderer.listen(el, 'mouseenter', () => {
      if (this.showTimeout) {
        clearTimeout(this.showTimeout);
        this.showTimeout = null;
      }
    });

    this.renderer.listen(el, 'mouseleave', () => {
      this.destroyTooltip();
    });
  }

  private destroyTooltip(): void {
    if (this.unlistenDestroy) {
      this.unlistenDestroy();
      this.unlistenDestroy = null;
    }
    if (this.tooltipEl) {
      this.renderer.removeChild(document.body, this.tooltipEl);
      this.tooltipEl = null;
    }
  }

  private positionTooltip(): void {
    if (!this.tooltipEl) return;

    const hostRect = this.host.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltipEl.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const gap = 8;

    let top: number;
    let left: number;
    let effectivePosition = this.tooltipPosition;

    const fitsTop = hostRect.top - tooltipRect.height - gap > 0;
    const fitsBottom = hostRect.bottom + tooltipRect.height + gap < viewportH;
    const fitsLeft = hostRect.left - tooltipRect.width - gap > 0;
    const fitsRight = hostRect.right + tooltipRect.width + gap < viewportW;

    if (effectivePosition === 'top' && !fitsTop && fitsBottom) effectivePosition = 'bottom';
    else if (effectivePosition === 'bottom' && !fitsBottom && fitsTop) effectivePosition = 'top';
    else if (effectivePosition === 'left' && !fitsLeft && fitsRight) effectivePosition = 'right';
    else if (effectivePosition === 'right' && !fitsRight && fitsLeft) effectivePosition = 'left';

    switch (effectivePosition) {
      case 'top':
        top = hostRect.top - tooltipRect.height - gap;
        left = hostRect.left + hostRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = hostRect.bottom + gap;
        left = hostRect.left + hostRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = hostRect.top + hostRect.height / 2 - tooltipRect.height / 2;
        left = hostRect.left - tooltipRect.width - gap;
        break;
      case 'right':
        top = hostRect.top + hostRect.height / 2 - tooltipRect.height / 2;
        left = hostRect.right + gap;
        break;
    }

    top = Math.max(4, Math.min(top, viewportH - tooltipRect.height - 4));
    left = Math.max(4, Math.min(left, viewportW - tooltipRect.width - 4));

    this.renderer.setStyle(this.tooltipEl, 'position', 'fixed');
    this.renderer.setStyle(this.tooltipEl, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipEl, 'left', `${left}px`);
    this.renderer.setStyle(this.tooltipEl, 'z-index', '9999');
  }

  @HostListener('mouseenter') onMouseEnter(): void { this.show(); }
  @HostListener('mouseleave') onMouseLeave(): void { this.hide(); }
  @HostListener('focusin') onFocusIn(): void { this.show(); }
  @HostListener('focusout') onFocusOut(): void { this.hide(); }
}
