import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[appSortableList]',
})
export class SortableListDirective<T> {
  @Input('appSortableList') items: T[] = [];
  @Output('appSortableListChange') itemsChange = new EventEmitter<T[]>();

  private dragIndex: number | null = null;
  private dropIndex: number | null = null;

  constructor(private hostRef: ElementRef<HTMLElement>) {}

  @HostListener('dragstart', ['$event'])
  onDragStart(event: DragEvent): void {
    const target = this.findItemElement(event.target as HTMLElement);
    if (!target) return;

    this.dragIndex = this.getItemIndex(target);
    if (this.dragIndex === null) return;

    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/plain', String(this.dragIndex));

    target.classList.add('sortable-item--dragging');
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';

    const target = this.findItemElement(event.target as HTMLElement);
    if (!target) return;

    this.clearDropIndicator();
    this.dropIndex = this.getItemIndex(target);
    if (this.dropIndex !== null && this.dropIndex !== this.dragIndex) {
      target.classList.add('sortable-item--drop-target');
    }
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.clearDropIndicator();

    if (this.dragIndex === null || this.dropIndex === null) return;
    if (this.dragIndex === this.dropIndex) {
      this.resetDragState();
      return;
    }

    const reordered = [...this.items];
    const [moved] = reordered.splice(this.dragIndex, 1);
    reordered.splice(this.dropIndex, 0, moved);

    this.itemsChange.emit(reordered);
    this.resetDragState();
  }

  @HostListener('dragend')
  onDragEnd(): void {
    this.clearDropIndicator();
    this.clearDraggingClass();
    this.resetDragState();
  }

  private findItemElement(target: HTMLElement): HTMLElement | null {
    let el: HTMLElement | null = target;
    const host = this.hostRef.nativeElement;
    while (el && el !== host) {
      if (el.hasAttribute('draggable') && el.getAttribute('draggable') === 'true') {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  private getItemIndex(el: HTMLElement): number | null {
    const idx = el.getAttribute('data-index');
    return idx !== null ? Number(idx) : null;
  }

  private clearDropIndicator(): void {
    this.hostRef.nativeElement.querySelectorAll('.sortable-item--drop-target').forEach((el) => {
      el.classList.remove('sortable-item--drop-target');
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
  }
}
