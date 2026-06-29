import { Component, input, ViewEncapsulation } from '@angular/core';
import { CvProfile } from '../../../core/models/cv-profile.model';

@Component({
  selector: 'app-profile-summary-chip',
  imports: [],
  templateUrl: './profile-summary-chip.html',
  styleUrl: './profile-summary-chip.css',
  encapsulation: ViewEncapsulation.None,
})
export class ProfileSummaryChip {
  readonly profile = input.required<CvProfile>();

  summaryHtml(): string {
    const value = this.profile().professionalSummary ?? '';

    // Quill normally stores HTML (<p>, <br>, lists, etc.). Older/plain values can
    // still contain raw newlines; convert those to <br> so CV templates preserve
    // line breaks when rendering through [innerHTML].
    if (/<\/?[a-z][\s\S]*>/i.test(value)) {
      return value;
    }

    return value.replace(/\r\n|\r|\n/g, '<br>');
  }
}
