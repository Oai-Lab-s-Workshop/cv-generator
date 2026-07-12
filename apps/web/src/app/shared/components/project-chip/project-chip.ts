import { Component, input } from '@angular/core';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-chip',
  imports: [],
  templateUrl: './project-chip.html',
  styleUrl: './project-chip.css',
})
export class ProjectChip {
  readonly project = input.required<Project>();
}
