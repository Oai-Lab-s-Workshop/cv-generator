import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { CvData } from '../../../core/models/cv-data.model';
import { PocketBaseService } from '../../../core/services/pocketbase.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import { IconLabelData } from '../../../shared/components/icon-label-data/icon-label-data';
import { EducationChip } from '../../../shared/components/education-chip/education-chip';
import { CardProject } from '../../../shared/components/card-project/card-project';
import { Project } from '../../../core/models/project.model';

type SectionKey = 'projects' | 'experience' | 'skills' | 'diplomas';
type SectionMode = 'full' | 'compact';

@Component({
  selector: 'app-supa-cv-page',
  templateUrl: './supa-cv-page.html',
  styleUrl: './supa-cv-page.css',
  imports: [IconLabelData, EducationChip, CardProject],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SupaCVPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly pocketBaseService = inject(PocketBaseService);
  private readonly injector = inject(Injector);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly pageHeightMm = 297;
  private requestId = 0;
  private fitFrameId: number | null = null;
  private readonly sectionPriority: SectionKey[] = ['experience', 'projects', 'skills', 'diplomas'];

  @ViewChild('resumeRoot') private readonly resumeRoot?: ElementRef<HTMLElement>;
  @ViewChild('resumeMain') private readonly resumeMain?: ElementRef<HTMLElement>;

  readonly cvProfileId = input<string | null>(null);
  readonly previewData = input<CvData | null>(null);
  readonly cvData = signal<CvData | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly visibleProjectCount = signal<number | null>(null);
  readonly sectionModes = signal<Record<SectionKey, SectionMode>>({
    projects: 'full',
    experience: 'full',
    skills: 'full',
    diplomas: 'full',
  });

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

    effect(
      () => {
        if (!this.cvData()) {
          return;
        }

        this.scheduleFitToA4();
      },
      { injector: this.injector },
    );
  }

  ngAfterViewInit(): void {
    if (this.cvData()) {
      this.scheduleFitToA4();
    }

    if (typeof document !== 'undefined' && 'fonts' in document) {
      void (document as Document & { fonts: FontFaceSet }).fonts.ready.then(() => {
        this.scheduleFitToA4();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.fitFrameId !== null) {
      cancelAnimationFrame(this.fitFrameId);
      this.fitFrameId = null;
    }
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

  private scheduleFitToA4(): void {
    if (this.fitFrameId !== null) {
      cancelAnimationFrame(this.fitFrameId);
    }

    this.fitFrameId = requestAnimationFrame(() => {
      this.fitFrameId = null;
      this.fitSectionsToA4();
    });
  }

  private fitSectionsToA4(): void {
    const projectCount = this.cvData()?.projects.length ?? 0;

    if (!this.resumeMain?.nativeElement) {
      return;
    }

    this.visibleProjectCount.set(projectCount);
    this.sectionModes.set({
      projects: 'full',
      experience: 'full',
      skills: 'full',
      diplomas: 'full',
    });
    this.changeDetectorRef.detectChanges();

    if (this.mainFits()) {
      return;
    }

    for (const sectionKey of this.sectionPriority) {
      if (sectionKey === 'projects') {
        this.fitProjectsSection(projectCount);

        if (this.mainFits()) {
          return;
        }

        continue;
      }

      this.sectionModes.update((modes) => ({ ...modes, [sectionKey]: 'compact' }));
      this.changeDetectorRef.detectChanges();

      if (this.mainFits()) {
        return;
      }
    }
  }

  private fitProjectsSection(projectCount: number): void {
    const minimumVisibleProjects = Math.min(2, projectCount);
    let visibleProjects = this.visibleProjectCount() ?? projectCount;

    this.sectionModes.update((modes) => ({ ...modes, projects: 'compact' }));
    this.changeDetectorRef.detectChanges();

    while (!this.mainFits() && visibleProjects > minimumVisibleProjects) {
      visibleProjects -= 1;
      this.visibleProjectCount.set(visibleProjects);
      this.changeDetectorRef.detectChanges();
    }
  }

  private mainFits(): boolean {
    const mainElement = this.resumeMain?.nativeElement;
    const rootElement = this.resumeRoot?.nativeElement;

    if (!rootElement || !mainElement) {
      return true;
    }

    const rootRect = rootElement.getBoundingClientRect();
    const mainRect = mainElement.getBoundingClientRect();
    const mainBottomInPage = mainRect.top - rootRect.top + mainElement.scrollHeight;

    return mainBottomInPage <= this.mmToPx(this.pageHeightMm) + 2;
  }

  private mmToPx(mm: number): number {
    return (mm * 96) / 25.4;
  }
  protected getVisibleProjects(projects: Project[]): Project[] {
    const visibleProjectCount = this.visibleProjectCount();

    return projects.slice(0, visibleProjectCount ?? projects.length);
  }
}
