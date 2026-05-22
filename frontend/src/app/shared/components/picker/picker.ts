import { Component, ElementRef, EventEmitter, Input, Output, HostListener, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface PickerItem {
  id: string;
  label: string;
  subtitle?: string;
}

@Component({
  selector: 'app-picker',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './picker.html',
  styleUrl: './picker.css',
})
export class PickerComponent {
  @Input() mode: 'single' | 'multi' = 'multi';
  @Input() items: PickerItem[] = [];
  @Input() selected: string[] = [];
  @Input() allowCreate = false;
  @Input() placeholder = 'Rechercher...';
  @Input() createLabel = 'Creer';
  @Input() emptyLabel = 'Aucun element disponible';

  @Output() selectionChange = new EventEmitter<string[]>();
  @Output() create = new EventEmitter<string>();

  searchQuery = signal('');
  isOpen = signal(false);

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  filteredItems = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.items;
    return this.items.filter((item) => item.label.toLowerCase().includes(q));
  });

  selectedItems = computed(() =>
    this.items.filter((item) => this.selected.includes(item.id)),
  );

  get selectedLabel(): string {
    if (this.mode === 'single') {
      const sel = this.selectedItems();
      return sel.length ? sel[0].label : '';
    }
    return '';
  }

  togglePanel(): void {
    this.isOpen.update((v) => !v);
  }

  close(): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
  }

  toggleItem(id: string): void {
    if (this.mode === 'single') {
      this.selectionChange.emit([id]);
      this.close();
      return;
    }
    const idx = this.selected.indexOf(id);
    if (idx >= 0) {
      this.selectionChange.emit(this.selected.filter((s) => s !== id));
    } else {
      this.selectionChange.emit([...this.selected, id]);
    }
  }

  removeSelected(id: string): void {
    this.selectionChange.emit(this.selected.filter((s) => s !== id));
  }

  isSelected(id: string): boolean {
    return this.selected.includes(id);
  }

  onCreate(): void {
    const name = this.searchQuery().trim();
    if (!name) return;
    this.create.emit(name);
    this.searchQuery.set('');
  }
}
