import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { TooltipDirective } from './tooltip';

@Component({
  standalone: true,
  imports: [TooltipDirective],
  template: `<span [appTooltip]="'Test tooltip'">Hover me</span>`,
})
class TestHostComponent {}

describe('TooltipDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not show tooltip before hover', () => {
    const tooltip = document.querySelector('.app-tooltip');
    expect(tooltip).toBeNull();
  });
});
