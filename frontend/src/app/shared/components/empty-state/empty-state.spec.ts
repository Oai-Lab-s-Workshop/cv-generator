import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title', () => {
    fixture.componentRef.setInput('title', 'Rien ici');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.empty-state__title');
    expect(el.textContent).toContain('Rien ici');
  });

  it('should emit action on button click', () => {
    let emitted = false;
    component.action.subscribe(() => (emitted = true));

    const btn = fixture.nativeElement.querySelector('.empty-state__action');
    btn.click();
    expect(emitted).toBe(true);
  });

  it('should hide button when actionLabel is empty', () => {
    fixture.componentRef.setInput('actionLabel', '');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.empty-state__action');
    expect(btn).toBeNull();
  });
});
