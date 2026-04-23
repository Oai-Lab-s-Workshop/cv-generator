import { Component, input } from '@angular/core';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-card-project',
  imports: [],
  templateUrl: './card-project.html',
  styleUrl: './card-project.css',
})
export class CardProject {
  readonly project = input.required<Project>();
}
