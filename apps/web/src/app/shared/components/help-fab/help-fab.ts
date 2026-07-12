import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-help-fab',
  standalone: true,
  templateUrl: './help-fab.html',
  styleUrl: './help-fab.css',
})
export class HelpFabComponent {
  @Output() open = new EventEmitter<void>();
}
