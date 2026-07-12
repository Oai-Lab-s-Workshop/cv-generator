import { Component, input } from '@angular/core';
import { Degree } from '../../../core/models/degree.model';

@Component({
  selector: 'app-education-chip',
  imports: [],
  templateUrl: './education-chip.html',
  styleUrl: './education-chip.css',
})
export class EducationChip {
  readonly diploma = input.required<Degree>();
}
