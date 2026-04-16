import { Component, input } from '@angular/core';
import { CvProfile } from '../../../core/models/cv-profile.model';

@Component({
  selector: 'app-profile-summary-chip',
  imports: [],
  templateUrl: './profile-summary-chip.html',
  styleUrl: './profile-summary-chip.css',
})
export class ProfileSummaryChip {
  readonly profile = input.required<CvProfile>();
}
