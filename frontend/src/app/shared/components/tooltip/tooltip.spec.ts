import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TooltipDirective } from './tooltip';

@Component({
  standalone: true,
  imports: [TooltipDirective],
  template: `
    <span class="with-tooltip" [appTooltip]="'Test tooltip'">Hover me</span>
    <span class="second-tooltip" [appTooltip]="'Second tooltip'">Hover me too</span>
    <span class="without-tooltip" [appTooltip]="''">No tooltip</span>
  `,
})
class TestHostComponent {}

describe('TooltipDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  function mouseEvent(type: string, clientX = 120, clientY = 80): MouseEvent {
    return new MouseEvent(type, { bubbles: true, clientX, clientY });
  }

  function triggerTooltipEvent(type: string, clientX = 120, clientY = 80, selector = '.with-tooltip'): void {
    const trigger = fixture.debugElement.query(By.css(selector));
    trigger.triggerEventHandler(type, mouseEvent(type, clientX, clientY));
  }

  function setViewport(width: number, height: number): void {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    document.querySelectorAll('.app-tooltip').forEach((tooltip) => tooltip.remove());
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not show tooltip before hover', () => {
    const tooltip = document.querySelector('.app-tooltip');
    expect(tooltip).toBeNull();
  });

  it('shows tooltip after hover delay', fakeAsync(() => {
    triggerTooltipEvent('mouseenter');
    tick(299);
    expect(document.querySelector('.app-tooltip')).toBeNull();

    tick(1);
    const tooltip = document.querySelector('.app-tooltip') as HTMLElement;

    expect(tooltip).toBeTruthy();
    expect(tooltip.textContent).toBe('Test tooltip');
    expect(tooltip.style.pointerEvents).toBe('none');
  }));

  it('removes tooltip on mouseleave', fakeAsync(() => {
    triggerTooltipEvent('mouseenter');
    tick(300);
    expect(document.querySelector('.app-tooltip')).toBeTruthy();

    triggerTooltipEvent('mouseleave');
    expect(document.querySelector('.app-tooltip')).toBeNull();
  }));

  it('follows pointer movement while visible', fakeAsync(() => {
    triggerTooltipEvent('mouseenter', 20, 30);
    tick(300);
    const tooltip = document.querySelector('.app-tooltip') as HTMLElement;
    const initialLeft = tooltip.style.left;
    const initialTop = tooltip.style.top;

    triggerTooltipEvent('mousemove', 180, 140);

    expect(tooltip.style.left).not.toBe(initialLeft);
    expect(tooltip.style.top).not.toBe(initialTop);
  }));

  it('does not render empty tooltip content', fakeAsync(() => {
    triggerTooltipEvent('mouseenter', 120, 80, '.without-tooltip');
    tick(300);

    expect(document.querySelector('.app-tooltip')).toBeNull();
  }));

  it('keeps only one tooltip in the document', fakeAsync(() => {
    triggerTooltipEvent('mouseenter', 120, 80, '.with-tooltip');
    tick(300);
    expect(document.querySelectorAll('.app-tooltip')).toHaveLength(1);
    expect(document.querySelector('.app-tooltip')?.textContent).toBe('Test tooltip');

    triggerTooltipEvent('mouseenter', 220, 120, '.second-tooltip');
    tick(300);

    expect(document.querySelectorAll('.app-tooltip')).toHaveLength(1);
    expect(document.querySelector('.app-tooltip')?.textContent).toBe('Second tooltip');
  }));

  it('does not show stale tooltip after rapid enter and leave', fakeAsync(() => {
    triggerTooltipEvent('mouseenter');
    tick(100);
    triggerTooltipEvent('mouseleave');
    tick(300);

    expect(document.querySelector('.app-tooltip')).toBeNull();
  }));

  it('cancels first pending tooltip when hovering another trigger', fakeAsync(() => {
    triggerTooltipEvent('mouseenter', 120, 80, '.with-tooltip');
    tick(100);
    triggerTooltipEvent('mouseenter', 220, 120, '.second-tooltip');
    tick(300);

    expect(document.querySelectorAll('.app-tooltip')).toHaveLength(1);
    expect(document.querySelector('.app-tooltip')?.textContent).toBe('Second tooltip');
  }));

  it('cleans up tooltip when host is destroyed', fakeAsync(() => {
    triggerTooltipEvent('mouseenter');
    tick(300);
    expect(document.querySelector('.app-tooltip')).toBeTruthy();

    fixture.destroy();
    expect(document.querySelector('.app-tooltip')).toBeNull();
  }));

  it('shows and hides tooltip from keyboard focus', fakeAsync(() => {
    triggerTooltipEvent('focusin');
    tick(300);
    expect(document.querySelector('.app-tooltip')).toBeTruthy();

    triggerTooltipEvent('focusout');
    expect(document.querySelector('.app-tooltip')).toBeNull();
  }));

  it('keeps tooltip inside viewport edges', fakeAsync(() => {
    setViewport(40, 40);

    triggerTooltipEvent('mouseenter', 38, 38);
    tick(300);

    const tooltip = document.querySelector('.app-tooltip') as HTMLElement;
    expect(Number.parseFloat(tooltip.style.left)).toBeGreaterThanOrEqual(8);
    expect(Number.parseFloat(tooltip.style.top)).toBeGreaterThanOrEqual(8);

    setViewport(1024, 768);
  }));
});
