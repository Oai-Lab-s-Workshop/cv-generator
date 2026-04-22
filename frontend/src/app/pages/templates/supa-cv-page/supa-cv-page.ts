import { ChangeDetectionStrategy, Component, inject, Injector, input, effect, OnInit, signal } from '@angular/core';
import { CvData } from '../../../core/models/cv-data.model';
import { PocketBaseService } from '../../../core/services/pocketbase.service';
import { getErrorMessage } from '../../../core/utils/error-message';

@Component({
  selector: 'app-supa-cv-page',
  templateUrl: './supa-cv-page.html',
  styleUrl: './supa-cv-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
}
