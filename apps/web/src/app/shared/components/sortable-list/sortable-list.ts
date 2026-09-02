import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Injector,
  Input,
  Output,
  afterNextRender,
} from '@angular/core';

/**
 * Custom drag payload type. Only drags carrying it are accepted, so an OS file
 * drag over the list is no longer swallowed as a reorder.
 */
const SORTABLE_MIME = 'application/x-resumate-sortable';

/** Safety net so a missed render cannot leave the page frozen mid-transition. */
const RENDER_TIMEOUT_MS = 200;

type DropSide = 'above' | 'below';

@Directive({
  standalone: true,
  selector: '[appSortableList]',
})
export class SortableListDirective<T> {
  @Input('appSortableList') items: T[] = [];
  @Output('appSortableListChange') itemsChange = new EventEmitter<T[]>();

  /** Index of the row currently being dragged. */
  private dragIndex: number | null = null;
  /** Index of the row currently hovered, and which of its edges we would drop against. */
  private dropIndex: number | null = null;
  private dropSide: DropSide | null = null;
  /** Cached so a stationary pointer does not re-query and re-class the list on every dragover. */
  private hoverRow: HTMLElement | null = null;
  private indicatorRow: HTMLElement | null = null;
  /**
   * True while a reorder is queued behind a view transition. A second reorder
   * started in that window would compute its new array from the pre-transition
   * order and overwrite the first, so it skips the animation instead.
   */
  private commitPending = false;

  constructor(
    private hostRef: ElementRef<HTMLElement>,
    private injector: Injector,
  ) {}

  @HostListener('dragstart', ['$event'])
  onDragStart(event: DragEvent): void {
    const row = this.findRow(event.target as HTMLElement | null);
    if (!row) return;

    const index = this.getRowIndex(row);
    if (index === null) return;

    this.dragIndex = index;

    const transfer = event.dataTransfer;
    if (transfer) {
      transfer.effectAllowed = 'move';
      transfer.setData(SORTABLE_MIME, String(index));
      transfer.setData('text/plain', String(index));

      // Anchor the ghost to the grab point so it tracks the cursor instead of
      // snapping to a corner. Called before the dragging class so the snapshot
      // is not taken from the faded row.
      if (typeof transfer.setDragImage === 'function') {
        const rect = row.getBoundingClientRect();
        transfer.setDragImage(row, event.clientX - rect.left, event.clientY - rect.top);
      }
    }

    row.classList.add('sortable-item--dragging');
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    if (!this.isSortableDrag(event)) return;

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    const row = this.findRow(event.target as HTMLElement | null);
    const index = row ? this.getRowIndex(row) : null;

    // Pointer is over list padding, a row gap or the list border: forget the
    // previous hover rather than letting a stale index be committed on drop.
    if (!row || index === null) {
      this.clearHover();
      return;
    }

    const rect = row.getBoundingClientRect();
    const side: DropSide = event.clientY < rect.top + rect.height / 2 ? 'above' : 'below';

    if (this.hoverRow === row && this.dropSide === side) return;

    this.clearIndicator();
    this.hoverRow = row;
    this.dropIndex = index;
    this.dropSide = side;

    const target = this.resolveTargetIndex();
    if (target !== null && target !== this.dragIndex) {
      row.classList.add(side === 'above' ? 'sortable-item--drop-above' : 'sortable-item--drop-below');
      this.indicatorRow = row;
    }
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    const related = event.relatedTarget as Node | null;
    if (related && this.hostRef.nativeElement.contains(related)) return;
    this.clearHover();
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    if (!this.isSortableDrag(event)) return;
    event.preventDefault();

    const from = this.dragIndex;
    const to = this.resolveTargetIndex();

    this.clearIndicator();
    this.clearDraggingClass();
    this.resetDragState();

    if (from === null || to === null || from === to) return;

    const reordered = [...this.items];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);

    this.commit(reordered);
  }

  @HostListener('dragend')
  onDragEnd(): void {
    this.clearIndicator();
    this.clearDraggingClass();
    this.resetDragState();
  }

  /**
   * Translates "hovered row + which edge" into the destination index, accounting
   * for the dragged item being removed from the array before reinsertion.
   */
  private resolveTargetIndex(): number | null {
    if (this.dragIndex === null || this.dropIndex === null || this.dropSide === null) return null;

    const insertAt = this.dropIndex + (this.dropSide === 'below' ? 1 : 0);
    return insertAt - (this.dragIndex < insertAt ? 1 : 0);
  }

  /**
   * Applies the reorder inside a view transition so rows glide to their new
   * positions. Falls back to an immediate emit when the API is unavailable or
   * the user prefers reduced motion.
   */
  private commit(reordered: T[]): void {
    const reduceMotion =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Guarded at runtime: the lib types declare it as always present, but it is
    // absent in jsdom and in browsers without View Transitions support.
    if (typeof document.startViewTransition !== 'function' || reduceMotion || this.commitPending) {
      this.itemsChange.emit(reordered);
      return;
    }

    this.commitPending = true;

    // The transition must not resolve until Angular has rendered the new order,
    // otherwise it animates the unchanged DOM and the update lands late.
    //
    // Two approaches do NOT work here: ApplicationRef.whenStable() deadlocks
    // (this callback runs as a zone task, so its own pending promise keeps the
    // app perpetually unstable), and ApplicationRef.tick() throws because change
    // detection is already in progress. afterNextRender resolves on the render
    // that the emit schedules; the timeout is a safety net so a missed render can
    // never leave the page frozen mid-transition.
    document.startViewTransition(() => {
      this.itemsChange.emit(reordered);

      return Promise.race([
        new Promise<void>((resolve) => {
          afterNextRender(() => resolve(), { injector: this.injector });
        }),
        new Promise<void>((resolve) => setTimeout(resolve, RENDER_TIMEOUT_MS)),
      ]).finally(() => {
        // Released once the model is updated, not when the animation ends, so
        // the next drag still animates.
        this.commitPending = false;
      });
    });
  }

  /** Only our own drags are accepted; a file drag from the OS must pass through. */
  private isSortableDrag(event: DragEvent): boolean {
    if (this.dragIndex !== null) return true;

    const types = event.dataTransfer?.types;
    return types ? Array.from(types).includes(SORTABLE_MIME) : false;
  }

  private findRow(target: HTMLElement | null): HTMLElement | null {
    const host = this.hostRef.nativeElement;
    let el: HTMLElement | null = target;

    while (el && el !== host) {
      if (el.hasAttribute('data-index')) return el;
      el = el.parentElement;
    }

    return null;
  }

  private getRowIndex(el: HTMLElement): number | null {
    const raw = el.getAttribute('data-index');
    if (raw === null) return null;

    const index = Number(raw);
    return Number.isInteger(index) ? index : null;
  }

  private clearHover(): void {
    this.clearIndicator();
    this.hoverRow = null;
    this.dropIndex = null;
    this.dropSide = null;
  }

  private clearIndicator(): void {
    if (this.indicatorRow) {
      this.indicatorRow.classList.remove('sortable-item--drop-above', 'sortable-item--drop-below');
      this.indicatorRow = null;
      return;
    }

    this.hostRef.nativeElement
      .querySelectorAll('.sortable-item--drop-above, .sortable-item--drop-below')
      .forEach((el) => {
        el.classList.remove('sortable-item--drop-above', 'sortable-item--drop-below');
      });
  }

  private clearDraggingClass(): void {
    this.hostRef.nativeElement.querySelectorAll('.sortable-item--dragging').forEach((el) => {
      el.classList.remove('sortable-item--dragging');
    });
  }

  private resetDragState(): void {
    this.dragIndex = null;
    this.dropIndex = null;
    this.dropSide = null;
    this.hoverRow = null;
  }
}
