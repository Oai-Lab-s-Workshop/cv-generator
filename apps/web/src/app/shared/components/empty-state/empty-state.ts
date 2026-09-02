import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
})
export class EmptyStateComponent {
  @Input() title = 'Aucun element pour le moment';
  @Input() description = '';
  @Input() actionLabel = 'Ajouter';

  @Output() action = new EventEmitter<void>();
}
