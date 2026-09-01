import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { SortableListDirective } from './sortable-list';

const SORTABLE_MIME = 'application/x-resumate-sortable';

/** Rows are stubbed as a 100px-tall stack so midpoint maths is deterministic in jsdom. */
const ROW_HEIGHT = 100;

@Component({
  standalone: true,
  imports: [SortableListDirective],
  template: `
    <div [appSortableList]="items" (appSortableListChange)="onReorder($event)">
      @for (item of items; track item; let i = $index) {
        <div class="row" [attr.data-index]="i">
          <span class="drag-handle" draggable="true"></span>
          <span class="label">{{ item }}</span>
        </div>
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
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    host = fixture.nativeElement.firstElementChild as HTMLElement;
    stubRects();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render items', () => {
    expect(rows().length).toBe(3);
  });

  describe('drop position', () => {
    it('drops below a lower row and lands after it', () => {
      dragFrom(0);
      hover(2, 'below');
      drop(2, 'below');

      expect(fixture.componentInstance.items).toEqual(['B', 'C', 'A']);
    });

    it('drops above a lower row and lands before it', () => {
      dragFrom(0);
      hover(2, 'above');
      drop(2, 'above');

      expect(fixture.componentInstance.items).toEqual(['B', 'A', 'C']);
    });

    it('reaches the very top of the list', () => {
      dragFrom(2);
      hover(0, 'above');
      drop(0, 'above');

      expect(fixture.componentInstance.items).toEqual(['C', 'A', 'B']);
    });

    it('reaches the very bottom of the list', () => {
      dragFrom(1);
      hover(2, 'below');
      drop(2, 'below');

      expect(fixture.componentInstance.items).toEqual(['A', 'C', 'B']);
    });

    it('treats "below X" and "above the next row" as the same gap', () => {
      dragFrom(0);
      hover(1, 'below');
      drop(1, 'below');
      const viaBelow = fixture.componentInstance.items;

      fixture.componentInstance.items = ['A', 'B', 'C'];
      fixture.detectChanges();
      stubRects();

      dragFrom(0);
      hover(2, 'above');
      drop(2, 'above');

      expect(fixture.componentInstance.items).toEqual(viaBelow);
    });

    it('resolves the row from a nested drop target', () => {
      dragFrom(0);
      const label = rows()[1].querySelector('.label') as HTMLElement;
      label.dispatchEvent(dragEvent('dragover', { clientY: rowY(1, 'below') }));
      label.dispatchEvent(dragEvent('drop', { clientY: rowY(1, 'below') }));

      expect(fixture.componentInstance.items).toEqual(['B', 'A', 'C']);
    });
  });

  describe('no-op drops', () => {
    it.each([
      ['its own top edge', 1, 'above' as const],
      ['its own bottom edge', 1, 'below' as const],
      ['the gap above it', 0, 'below' as const],
    ])('does not emit when dropping onto %s', (_label, rowIndex, side) => {
      const reorderSpy = jest.spyOn(fixture.componentInstance, 'onReorder');

      dragFrom(1);
      hover(rowIndex, side);
      drop(rowIndex, side);

      expect(reorderSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance.items).toEqual(['A', 'B', 'C']);
    });
  });

  describe('stale state', () => {
    it('forgets the hovered row when the pointer moves off the rows', () => {
      const reorderSpy = jest.spyOn(fixture.componentInstance, 'onReorder');

      dragFrom(0);
      hover(2, 'below');
      // Pointer drifts onto list padding between rows: the previous target must
      // not be committed on drop.
      host.dispatchEvent(dragEvent('dragover', { clientY: 0 }));
      host.dispatchEvent(dragEvent('drop', { clientY: 0 }));

      expect(reorderSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance.items).toEqual(['A', 'B', 'C']);
    });

    it('forgets the hovered row when the pointer leaves the list', () => {
      const reorderSpy = jest.spyOn(fixture.componentInstance, 'onReorder');

      dragFrom(0);
      hover(2, 'below');
      host.dispatchEvent(dragEvent('dragleave', { relatedTarget: document.body }));
      drop(2, 'below');

      expect(reorderSpy).not.toHaveBeenCalled();
    });

    it('keeps the hovered row when dragleave fires for a child element', () => {
      dragFrom(0);
      hover(2, 'below');
      host.dispatchEvent(dragEvent('dragleave', { relatedTarget: rows()[2] }));
      drop(2, 'below');

      expect(fixture.componentInstance.items).toEqual(['B', 'C', 'A']);
    });
  });

  describe('visual feedback', () => {
    it('marks the dragged row and the drop side, then clears on dragend', () => {
      dragFrom(0);
      hover(1, 'below');

      expect(rows()[0].classList.contains('sortable-item--dragging')).toBe(true);
      expect(rows()[1].classList.contains('sortable-item--drop-below')).toBe(true);
      expect(rows()[1].classList.contains('sortable-item--drop-above')).toBe(false);

      rows()[0].dispatchEvent(dragEvent('dragend'));

      expect(rows()[0].classList.contains('sortable-item--dragging')).toBe(false);
      expect(rows()[1].classList.contains('sortable-item--drop-below')).toBe(false);
    });

    it('moves the indicator to the other side without leaving the old one behind', () => {
      dragFrom(0);
      hover(2, 'below');
      hover(2, 'above');

      expect(rows()[2].classList.contains('sortable-item--drop-below')).toBe(false);
      expect(rows()[2].classList.contains('sortable-item--drop-above')).toBe(true);
    });

    it('shows no indicator when the drop would be a no-op', () => {
      dragFrom(1);
      hover(1, 'above');

      expect(rows()[1].classList.contains('sortable-item--drop-above')).toBe(false);
      expect(rows()[1].classList.contains('sortable-item--drop-below')).toBe(false);
    });
  });

  describe('foreign drags', () => {
    it('ignores a drag that does not carry the sortable payload', () => {
      const reorderSpy = jest.spyOn(fixture.componentInstance, 'onReorder');
      const over = dragEvent('dragover', { clientY: rowY(1, 'below'), types: ['Files'] });

      rows()[1].dispatchEvent(over);

      // Not claimed as a drop target, so the browser keeps its default handling.
      expect(over.defaultPrevented).toBe(false);
      expect(rows()[1].classList.contains('sortable-item--drop-below')).toBe(false);
      expect(reorderSpy).not.toHaveBeenCalled();
    });

    it('claims a drag that does carry the sortable payload', () => {
      dragFrom(0);
      const over = dragEvent('dragover', { clientY: rowY(1, 'below') });

      rows()[1].dispatchEvent(over);

      expect(over.defaultPrevented).toBe(true);
    });
  });

  it('should ignore drag events outside sortable items', () => {
    host.dispatchEvent(dragEvent('dragstart'));
    host.dispatchEvent(dragEvent('dragover'));
    host.dispatchEvent(dragEvent('drop'));

    expect(fixture.componentInstance.items).toEqual(['A', 'B', 'C']);
  });

  it('should ignore dragstart when a row has no data index', () => {
    rows()[0].removeAttribute('data-index');

    dragFrom(0);
    hover(1, 'below');
    drop(1, 'below');

    expect(fixture.componentInstance.items).toEqual(['A', 'B', 'C']);
  });

  it('anchors the drag image to the grab point', () => {
    const handle = rows()[0].querySelector('.drag-handle') as HTMLElement;
    const event = dragEvent('dragstart', { clientY: 30 });

    handle.dispatchEvent(event);

    expect(event.dataTransfer!.setDragImage).toHaveBeenCalledWith(rows()[0], 0, 30);
  });

  it('advertises the sortable payload on dragstart', () => {
    const handle = rows()[0].querySelector('.drag-handle') as HTMLElement;
    const event = dragEvent('dragstart');

    handle.dispatchEvent(event);

    expect(event.dataTransfer!.setData).toHaveBeenCalledWith(SORTABLE_MIME, '0');
  });

  describe('view transitions', () => {
    let startViewTransition: jest.Mock;

    beforeEach(() => {
      // jsdom has no View Transitions API, so install a stub that runs the
      // update callback synchronously and reports a never-settling result, which
      // keeps the "commit pending" window open for the guard test below.
      startViewTransition = jest.fn((callback: () => unknown) => {
        callback();
        return { finished: new Promise<void>(() => {}) };
      });
      Object.defineProperty(document, 'startViewTransition', {
        value: startViewTransition,
        configurable: true,
      });
    });

    afterEach(() => {
      delete (document as unknown as Record<string, unknown>)['startViewTransition'];
      delete (window as unknown as Record<string, unknown>)['matchMedia'];
      jest.restoreAllMocks();
    });

    it('applies the reorder inside a view transition when supported', () => {
      dragFrom(0);
      hover(2, 'below');
      drop(2, 'below');

      expect(startViewTransition).toHaveBeenCalledTimes(1);
      // The emit must happen inside the callback, not after it.
      expect(fixture.componentInstance.items).toEqual(['B', 'C', 'A']);
    });

    it('skips the transition when the user prefers reduced motion', () => {
      // jsdom does not implement matchMedia at all, so define it rather than spy.
      Object.defineProperty(window, 'matchMedia', {
        value: () => ({ matches: true }) as unknown as MediaQueryList,
        configurable: true,
      });

      dragFrom(0);
      hover(2, 'below');
      drop(2, 'below');

      expect(startViewTransition).not.toHaveBeenCalled();
      expect(fixture.componentInstance.items).toEqual(['B', 'C', 'A']);
    });

    it('does not queue a second transition while one is still pending', () => {
      const reorderSpy = jest.spyOn(fixture.componentInstance, 'onReorder');

      dragFrom(0);
      hover(1, 'below');
      drop(1, 'below');

      // Second reorder lands before the first transition settles: it must still
      // be applied, but without animating, so it cannot overwrite the first with
      // a stale array.
      dragFrom(0);
      hover(2, 'below');
      drop(2, 'below');

      expect(startViewTransition).toHaveBeenCalledTimes(1);
      expect(reorderSpy).toHaveBeenCalledTimes(2);
    });
  });

  // ── helpers ──

  function rows(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.row')) as HTMLElement[];
  }

  /** jsdom reports zero-size rects, so give each row a predictable box. */
  function stubRects(): void {
    rows().forEach((row, i) => {
      row.getBoundingClientRect = () =>
        ({
          top: i * ROW_HEIGHT,
          bottom: (i + 1) * ROW_HEIGHT,
          height: ROW_HEIGHT,
          left: 0,
          right: 200,
          width: 200,
          x: 0,
          y: i * ROW_HEIGHT,
          toJSON: () => ({}),
        }) as DOMRect;
    });
  }

  /** A y-coordinate clearly in the top or bottom half of the given row. */
  function rowY(index: number, side: 'above' | 'below'): number {
    return index * ROW_HEIGHT + (side === 'above' ? 10 : ROW_HEIGHT - 10);
  }

  function dragFrom(index: number): void {
    const handle = rows()[index].querySelector('.drag-handle') as HTMLElement;
    handle.dispatchEvent(dragEvent('dragstart', { clientY: rowY(index, 'above') }));
  }

  function hover(index: number, side: 'above' | 'below'): void {
    rows()[index].dispatchEvent(dragEvent('dragover', { clientY: rowY(index, side) }));
  }

  function drop(index: number, side: 'above' | 'below'): void {
    rows()[index].dispatchEvent(dragEvent('drop', { clientY: rowY(index, side) }));
  }

  function dragEvent(
    type: string,
    options: { clientY?: number; types?: string[]; relatedTarget?: EventTarget } = {},
  ): DragEvent {
    const event = new Event(type, { bubbles: true, cancelable: true }) as unknown as DragEvent;
    const dataTransfer = {
      effectAllowed: '',
      dropEffect: '',
      types: options.types ?? [SORTABLE_MIME, 'text/plain'],
      setData: jest.fn(),
      getData: jest.fn(),
      setDragImage: jest.fn(),
    };

    Object.defineProperty(event, 'dataTransfer', { value: dataTransfer, writable: true });
    Object.defineProperty(event, 'clientX', { value: 0, writable: true });
    Object.defineProperty(event, 'clientY', { value: options.clientY ?? 0, writable: true });

    if (options.relatedTarget !== undefined) {
      Object.defineProperty(event, 'relatedTarget', { value: options.relatedTarget, writable: true });
    }

    return event;
  }
});
