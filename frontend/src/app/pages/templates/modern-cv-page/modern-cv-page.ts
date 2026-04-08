import { ChangeDetectionStrategy, Component, Injector, effect, inject, input, OnInit, signal } from '@angular/core';
import { CvData } from '../../../core/models/cv-data.model';
import { PocketBaseService } from '../../../core/services/pocketbase.service';
import { getErrorMessage } from '../../../core/utils/error-message';

@Component({
  selector: 'app-modern-cv-page',
  templateUrl: './modern-cv-page.html',
  styleUrl: './modern-cv-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModernCvPage implements OnInit {
  private readonly pocketBaseService = inject(PocketBaseService);
  private readonly injector = inject(Injector);
  private requestId = 0;

  readonly cvProfileId = input.required<string>();
  readonly cvData = signal<CvData | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    effect(
      () => {
        void this.loadCvData(this.cvProfileId());
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
