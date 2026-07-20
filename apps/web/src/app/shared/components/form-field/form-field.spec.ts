import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormFieldComponent } from './form-field';

describe('FormFieldComponent', () => {
  let component: FormFieldComponent;
  let fixture: ComponentFixture<FormFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show required asterisk when required is true', () => {
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.form-field__required');
    expect(el).toBeTruthy();
    expect(el.textContent).toContain('*');
  });

  it('should show error message when invalid and errorMessage set', () => {
    fixture.componentRef.setInput('invalid', true);
    fixture.componentRef.setInput('errorMessage', 'Champ requis');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.form-field__error');
    expect(el).toBeTruthy();
    expect(el.textContent).toContain('Champ requis');
  });

  it('should show helper text when not invalid', () => {
    fixture.componentRef.setInput('helperText', 'Conseil');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.form-field__helper');
    expect(el).toBeTruthy();
    expect(el.textContent).toContain('Conseil');
  });
});
