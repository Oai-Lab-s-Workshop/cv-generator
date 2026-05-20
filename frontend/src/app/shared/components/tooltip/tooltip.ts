import { Directive, ElementRef, HostListener, Input, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[appTooltip]',
})
export class TooltipDirective implements OnDestroy {
  private static activeInstance: TooltipDirective | null = null;
  private static activeTooltipEl: HTMLElement | null = null;

  @Input('appTooltip') content = '';
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

  private tooltipEl: HTMLElement | null = null;
  private showTimeout: ReturnType<typeof setTimeout> | null = null;
  private isHovering = false;
  private pointerX = 0;
  private pointerY = 0;

  constructor(
    private host: ElementRef<HTMLElement>,
    private renderer: Renderer2,
  ) {}

  ngOnDestroy(): void {
    this.hide();
  }

  private show(): void {
    this.clearShowTimeout();

    if (!this.content?.trim()) return;

    TooltipDirective.destroyActiveTooltip();
    TooltipDirective.activeInstance = this;

    this.showTimeout = setTimeout(() => {
      if (TooltipDirective.activeInstance !== this || !this.isHovering) return;
      this.createTooltip();
    }, 300);
  }

  private hide(): void {
    this.clearShowTimeout();
    this.destroyTooltip();

    if (TooltipDirective.activeInstance === this) {
      TooltipDirective.activeInstance = null;
    }
  }

  private clearShowTimeout(): void {
    if (!this.showTimeout) return;

    clearTimeout(this.showTimeout);
    this.showTimeout = null;
  }

  private createTooltip(): void {
    TooltipDirective.destroyActiveTooltip();

    const el = this.renderer.createElement('div');
    this.renderer.addClass(el, 'app-tooltip');
    this.renderer.appendChild(el, this.renderer.createText(this.content));
    this.applyTooltipStyles(el);

    this.renderer.appendChild(document.body, el);
    this.tooltipEl = el;
    TooltipDirective.activeTooltipEl = el;
    TooltipDirective.activeInstance = this;

    this.positionTooltipNearPointer();
  }

  private destroyTooltip(): void {
    const tooltipEl = this.tooltipEl;

    if (tooltipEl) {
      this.renderer.removeChild(document.body, tooltipEl);
      this.tooltipEl = null;
    }

    const activeTooltipEl = TooltipDirective.activeTooltipEl;

    if (activeTooltipEl && activeTooltipEl === tooltipEl && activeTooltipEl.isConnected) {
      activeTooltipEl.remove();
    }

    if (activeTooltipEl === tooltipEl || !activeTooltipEl?.isConnected) {
      TooltipDirective.activeTooltipEl = null;
    }
  }

  private static destroyActiveTooltip(): void {
    if (TooltipDirective.activeInstance) {
      TooltipDirective.activeInstance.clearShowTimeout();
      TooltipDirective.activeInstance.tooltipEl = null;
    }

    TooltipDirective.activeTooltipEl?.remove();
    document.querySelectorAll('.app-tooltip').forEach((tooltip) => tooltip.remove());
    TooltipDirective.activeTooltipEl = null;
  }

  private applyTooltipStyles(el: HTMLElement): void {
    const styles: Record<string, string> = {
      position: 'fixed',
      zIndex: '9999',
      maxWidth: '18rem',
      padding: '0.55rem 0.7rem',
      fontSize: '0.8125rem',
      fontWeight: '700',
      lineHeight: '1.4',
      color: 'light-dark(#172033, #e2e8f0)',
      background: 'light-dark(rgba(255, 255, 255, 0.96), rgba(30, 41, 59, 0.96))',
      border: '1px solid light-dark(rgba(148, 163, 184, 0.42), rgba(148, 163, 184, 0.2))',
      borderRadius: '0.85rem',
      boxShadow: 'light-dark(0 18px 50px rgba(15, 23, 42, 0.14), 0 18px 50px rgba(0, 0, 0, 0.35))',
      pointerEvents: 'none',
      backdropFilter: 'blur(12px)',
      transform: 'translate3d(0, 0, 0)',
      transition: 'opacity 120ms ease, transform 120ms ease',
      whiteSpace: 'normal',
    };

    Object.entries(styles).forEach(([property, value]) => this.renderer.setStyle(el, property, value));
  }

  private positionTooltipNearPointer(): void {
    if (!this.tooltipEl) return;

    const tooltipRect = this.tooltipEl.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const gap = 14;
    const edge = 8;
    let left = this.pointerX + gap;
    let top = this.pointerY + gap;

    if (left + tooltipRect.width + edge > viewportW) {
      left = this.pointerX - tooltipRect.width - gap;
    }

    if (top + tooltipRect.height + edge > viewportH) {
      top = this.pointerY - tooltipRect.height - gap;
    }

    top = Math.max(edge, Math.min(top, viewportH - tooltipRect.height - edge));
    left = Math.max(edge, Math.min(left, viewportW - tooltipRect.width - edge));

    this.renderer.setStyle(this.tooltipEl, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipEl, 'left', `${left}px`);
  }

  @HostListener('mouseenter', ['$event']) onMouseEnter(event: MouseEvent): void {
    this.isHovering = true;
    this.pointerX = event.clientX;
    this.pointerY = event.clientY;
    this.show();
  }

  @HostListener('mousemove', ['$event']) onMouseMove(event: MouseEvent): void {
    this.pointerX = event.clientX;
    this.pointerY = event.clientY;
    this.positionTooltipNearPointer();
  }

  @HostListener('mouseleave') onMouseLeave(): void {
    this.isHovering = false;
    this.hide();
  }
  @HostListener('focusin') onFocusIn(): void {
    this.isHovering = true;
    const hostRect = this.host.nativeElement.getBoundingClientRect();
    this.pointerX = hostRect.left + hostRect.width / 2;
    this.pointerY = hostRect.bottom;
    this.show();
  }
  @HostListener('focusout') onFocusOut(): void {
    this.isHovering = false;
    this.hide();
  }
}
