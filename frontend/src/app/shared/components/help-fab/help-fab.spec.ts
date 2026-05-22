import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelpFabComponent } from './help-fab';

describe('HelpFabComponent', () => {
  let component: HelpFabComponent;
  let fixture: ComponentFixture<HelpFabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpFabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HelpFabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit open on click', () => {
    let emitted = false;
    component.open.subscribe(() => (emitted = true));

    const btn = fixture.nativeElement.querySelector('.help-fab');
    btn.click();
    expect(emitted).toBe(true);
  });
});
