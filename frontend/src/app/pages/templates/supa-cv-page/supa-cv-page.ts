import { ChangeDetectionStrategy, Component, inject, Injector, input, effect, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CvData } from '../../../core/models/cv-data.model';
import { PocketBaseService } from '../../../core/services/pocketbase.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import { IconLabelData } from '../../../shared/components/icon-label-data/icon-label-data';
import { EducationChip } from '../../../shared/components/education-chip/education-chip';
import { CardProject } from '../../../shared/components/card-project/card-project';

@Component({
  selector: 'app-supa-cv-page',
  templateUrl: './supa-cv-page.html',
  styleUrl: './supa-cv-page.css',
  imports: [IconLabelData, EducationChip, CardProject],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SupaCVPage implements OnInit {
  
  private readonly pocketBaseService = inject(PocketBaseService);
  private readonly injector = inject(Injector);
  private requestId = 0;

  readonly cvProfileId = input<string | null>(null);
  readonly previewData = input<CvData | null>(null);
  readonly cvData = signal<CvData | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  protected getDate(dateStr: string | null | undefined): string {
    const date = this.pocketBaseService.toDate(dateStr);

    if (!date || Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  }

  ngOnInit(): void {
    effect(
      () => {
        const previewData = this.previewData();

        if (previewData) {
          this.cvData.set(previewData);
          this.isLoading.set(false);
          this.errorMessage.set(null);
          return;
        }

        const cvProfileId = this.cvProfileId();

        if (!cvProfileId) {
          this.cvData.set(null);
          this.isLoading.set(false);
          return;
        }

        void this.loadCvData(cvProfileId);
      },
      { injector: this.injector },
    );
  }

  private async loadCvData(cvProfileId: string): Promise<void> {
    const currentRequestId = ++this.requestId;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const cvData = await this.pocketBaseService.getCvDataByProfileId(cvProfileId);

      if (currentRequestId !== this.requestId) {
        return;
      }

      this.cvData.set(cvData);
    } catch (error: unknown) {
      if (currentRequestId !== this.requestId) {
        return;
      }

      this.cvData.set(null);
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      if (currentRequestId === this.requestId) {
        this.isLoading.set(false);
      }
    }
  }
  protected getSkillSpan(skill: { name?: string | null }): number {
    const name = (skill.name ?? '').trim();
    if (!name) return 1;
    const words = name.split(/\s+/).filter(Boolean);
    const charCount = name.length;
    const longestWord = words.reduce((max, w) => Math.max(max, w.length), 0);
    // Short single-label skills
    if (charCount <= 10 && words.length <= 2 && longestWord <= 10) {
      return 1;
    }
    // Medium labels
    if (charCount <= 22 && words.length <= 3 && longestWord <= 14) {
      return 2;
    }
    // Longer labels
    return 3;
  }
}
