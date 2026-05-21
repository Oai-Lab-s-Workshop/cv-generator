import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PickerComponent } from './picker';

describe('PickerComponent', () => {
  let component: PickerComponent;
  let fixture: ComponentFixture<PickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open panel on trigger click', () => {
    const trigger = fixture.nativeElement.querySelector('.picker__trigger');
    trigger.click();
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('.picker__panel');
    expect(panel).toBeTruthy();
  });

  it('should filter items on search', () => {
    fixture.componentRef.setInput('items', [
      { id: '1', label: 'Alpha' },
      { id: '2', label: 'Beta' },
    ]);
    fixture.detectChanges();

    component.isOpen.set(true);
    component.searchQuery.set('Alp');
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.picker__item');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Alpha');
  });

  it('should emit selectionChange on item click in multi mode', () => {
    fixture.componentRef.setInput('mode', 'multi');
    fixture.componentRef.setInput('items', [{ id: '1', label: 'Alpha' }]);
    fixture.detectChanges();

    let emitted: string[] = [];
    component.selectionChange.subscribe((v) => (emitted = v));

    component.isOpen.set(true);
    fixture.detectChanges();

    const item = fixture.nativeElement.querySelector('.picker__item');
    item.click();
    expect(emitted).toEqual(['1']);
  });

  it('should emit create event on create button click', () => {
    fixture.componentRef.setInput('allowCreate', true);
    fixture.detectChanges();

    let created = '';
    component.create.subscribe((v) => (created = v));

    component.isOpen.set(true);
    component.searchQuery.set('NewItem');
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.picker__create-btn');
    btn.click();
    expect(created).toBe('NewItem');
  });
});
