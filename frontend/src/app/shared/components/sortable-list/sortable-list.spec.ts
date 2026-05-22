import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { SortableListDirective } from './sortable-list';

@Component({
  standalone: true,
  imports: [SortableListDirective],
  template: `
    <div [appSortableList]="items" (appSortableListChange)="onReorder($event)">
      @for (item of items; track item; let i = $index) {
        <div draggable="true" [attr.data-index]="i">{{ item }}</div>
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

    const makeDragEvent = (type: string): DragEvent => {
      const event = new Event(type, { bubbles: true }) as unknown as DragEvent;
      const dt = { effectAllowed: '', dropEffect: '', setData: () => {}, getData: () => '' };
      Object.defineProperty(event, 'dataTransfer', { value: dt, writable: true });
      return event;
    };

    items[0].dispatchEvent(makeDragEvent('dragstart'));
    items[2].dispatchEvent(makeDragEvent('dragover'));
    items[2].dispatchEvent(makeDragEvent('drop'));

    expect(host.items).toEqual(['B', 'C', 'A']);
  });
});
