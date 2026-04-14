import { ChangeDetectionStrategy, Component, Injector, effect, inject, input, OnInit, signal } from '@angular/core';
import { CvData } from '../../../core/models/cv-data.model';
import { Job } from '../../../core/models/job.model';
import { PocketBaseService } from '../../../core/services/pocketbase.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import { ProjectChip } from '../../../shared/components/project-chip/project-chip';

type JobGroup = {
  company: string;
  jobs: Job[];
};

@Component({
  selector: 'app-classic-cv-page',
  imports: [ProjectChip],
  templateUrl: './classic-cv-page.html',
  styleUrl: './classic-cv-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassicCvPage implements OnInit {
  private readonly pocketBaseService = inject(PocketBaseService);
  private readonly injector = inject(Injector);
  private requestId = 0;
  private readonly responsibilitiesHtmlCache = new Map<string, string>();

  readonly cvProfileId = input.required<string>();
  readonly cvData = signal<CvData | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  protected groupJobsByCompany(jobs: Job[] | null | undefined): JobGroup[] {
    if (!jobs?.length) {
      return [];
    }

    const groups = new Map<string, JobGroup>();

    for (const job of jobs) {
      const company = job.company?.trim() || 'Unknown company';
      const existingGroup = groups.get(company);

      if (existingGroup) {
        existingGroup.jobs.push(job);
        continue;
      }

      groups.set(company, { company, jobs: [job] });
    }

    return Array.from(groups.values());
  }

  protected getDuration(startDate: string | null | undefined, endDate?: string | null): string {
    const start = this.pocketBaseService.toDate(startDate);
    const end = this.pocketBaseService.toDate(endDate) ?? new Date();

    console.log('Calculating duration for', { start, end }, +end - +(start as Date));
    if (!start || Number.isNaN(end.getTime()) || end < start) {
      return '';
    }

    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

    if (end.getDate() < start.getDate()) {
      months -= 1;
    }

    if (months <= 0) {
      return 'Less than 1 month';
    }

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    const parts: string[] = [];

    if (years > 0) {
      parts.push(`${years} yr${years > 1 ? 's' : ''}`);
    }

    if (remainingMonths > 0) {
      parts.push(`${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`);
    }

    return parts.join(' ');
  }

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
        void this.loadCvData(this.cvProfileId());
      },
      { injector: this.injector },
    );
  }

  //TODO: factor out common loading logic into a reusable service
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
