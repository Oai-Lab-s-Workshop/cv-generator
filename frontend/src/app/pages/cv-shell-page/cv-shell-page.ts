import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ClassicCvPage } from '../templates/classic-cv-page/classic-cv-page';
import { MinimalCvPage } from '../templates/minimal-cv-page/minimal-cv-page';
import { ModernCvPage } from '../templates/modern-cv-page/modern-cv-page';
import { parseCvSlug } from '../../core/utils/cv-slug';

@Component({
  selector: 'app-cv-shell-page',
  imports: [ClassicCvPage, ModernCvPage, MinimalCvPage],
  templateUrl: './cv-shell-page.html',
  styleUrl: './cv-shell-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvShellPage {
  readonly slug = input.required<string>();
  readonly parsedSlug = computed(() => parseCvSlug(this.slug()));
}
