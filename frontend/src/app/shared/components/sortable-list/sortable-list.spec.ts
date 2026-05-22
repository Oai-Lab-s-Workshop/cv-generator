import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { SortableListDirective } from './sortable-list';

@Component({
  standalone: true,
  imports: [SortableListDirective],
  template: `
    <div [appSortableList]="items" (appSortableListChange)="onReorder($event)">
      @for (item of items; track item; let i = $index) {
        <div draggable="true" [attr.data-index]="i"><span>{{ item }}</span></div>
      }
    </div>
  `,
})
class TestHostComponent {
  items: string[] = ['A', 'B', 'C'];
  onReorder(reordered: string[]): void {
    this.items = reordered;
  }
}

describe('SortableListDirective', () => {
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

  it('should render items', () => {
    const items = fixture.nativeElement.querySelectorAll('[draggable="true"]');
    expect(items.length).toBe(3);
  });

  it('should reorder items on drop', () => {
    const host = fixture.componentInstance;
    const items = fixture.nativeElement.querySelectorAll('[draggable="true"]');

    items[0].dispatchEvent(makeDragEvent('dragstart'));
    items[2].dispatchEvent(makeDragEvent('dragover'));
    items[2].dispatchEvent(makeDragEvent('drop'));

    expect(host.items).toEqual(['B', 'C', 'A']);
  });

  it('should find draggable parent elements from nested targets', () => {
    const host = fixture.componentInstance;
    const nested = fixture.nativeElement.querySelectorAll('[draggable="true"] span');

    nested[0].dispatchEvent(makeDragEvent('dragstart'));
    nested[1].dispatchEvent(makeDragEvent('dragover'));
    nested[1].dispatchEvent(makeDragEvent('drop'));

    expect(host.items).toEqual(['B', 'A', 'C']);
  });

  it('should ignore drag events outside sortable items', () => {
    const host = fixture.nativeElement.firstElementChild;
    const component = fixture.componentInstance;

    host.dispatchEvent(makeDragEvent('dragstart'));
    host.dispatchEvent(makeDragEvent('dragover'));
    host.dispatchEvent(makeDragEvent('drop'));

    expect(component.items).toEqual(['A', 'B', 'C']);
  });

  it('should not emit when dropping onto the dragged item', () => {
    const component = fixture.componentInstance;
    const reorderSpy = jest.spyOn(component, 'onReorder');
    const items = fixture.nativeElement.querySelectorAll('[draggable="true"]');

    items[1].dispatchEvent(makeDragEvent('dragstart'));
    items[1].dispatchEvent(makeDragEvent('dragover'));
    items[1].dispatchEvent(makeDragEvent('drop'));

    expect(reorderSpy).not.toHaveBeenCalled();
    expect(component.items).toEqual(['A', 'B', 'C']);
  });

  it('should clear indicator classes on drag end', () => {
    const items = fixture.nativeElement.querySelectorAll('[draggable="true"]');

    items[0].dispatchEvent(makeDragEvent('dragstart'));
    items[1].dispatchEvent(makeDragEvent('dragover'));
    expect(items[0].classList.contains('sortable-item--dragging')).toBe(true);
    expect(items[1].classList.contains('sortable-item--drop-target')).toBe(true);

    items[0].dispatchEvent(makeDragEvent('dragend'));

    expect(items[0].classList.contains('sortable-item--dragging')).toBe(false);
    expect(items[1].classList.contains('sortable-item--drop-target')).toBe(false);
  });

  it('should ignore dragstart when a draggable item has no data index', () => {
    const component = fixture.componentInstance;
    const items = fixture.nativeElement.querySelectorAll('[draggable="true"]');
    items[0].removeAttribute('data-index');

    items[0].dispatchEvent(makeDragEvent('dragstart'));
    items[1].dispatchEvent(makeDragEvent('dragover'));
    items[1].dispatchEvent(makeDragEvent('drop'));

    expect(component.items).toEqual(['A', 'B', 'C']);
  });

  function makeDragEvent(type: string): DragEvent {
    const event = new Event(type, { bubbles: true }) as unknown as DragEvent;
    const dataTransfer = { effectAllowed: '', dropEffect: '', setData: jest.fn(), getData: jest.fn() };
    Object.defineProperty(event, 'dataTransfer', { value: dataTransfer, writable: true });
    return event;
  }
});
