import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelpModalComponent } from './help-modal';

describe('HelpModalComponent', () => {
  let component: HelpModalComponent;
  let fixture: ComponentFixture<HelpModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HelpModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render when closed', () => {
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('.help-modal__panel');
    expect(panel).toBeNull();
  });

  it('should render when open', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('.help-modal__panel');
    expect(panel).toBeTruthy();
  });

  it('should emit close on backdrop click', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    let emitted = false;
    component.close.subscribe(() => (emitted = true));

    const backdrop = fixture.nativeElement.querySelector('.help-modal__backdrop');
    backdrop.click();
    expect(emitted).toBe(true);
  });

  it('should not emit close on panel click', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    let emitted = false;
    component.close.subscribe(() => (emitted = true));

    const panel = fixture.nativeElement.querySelector('.help-modal__panel');
    panel.click();
    expect(emitted).toBe(false);
  });

  it('should emit close on escape key', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    let emitted = false;
    component.close.subscribe(() => (emitted = true));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(emitted).toBe(true);
  });

  it('should ignore escape key when closed', () => {
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();

    let emitted = false;
    component.close.subscribe(() => (emitted = true));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(emitted).toBe(false);
  });
});
