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
import { CvProfileExtraValue } from '../../../core/models/cv-profile.model';
import { CvProfileExtraService } from '../../../core/services/cv-profile-extra.service';
import { PocketBaseService } from '../../../core/services/pocketbase.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import { IconLabelData } from '../../../shared/components/icon-label-data/icon-label-data';
import { EducationChip } from '../../../shared/components/education-chip/education-chip';
import { CardProject } from '../../../shared/components/card-project/card-project';
import { Project } from '../../../core/models/project.model';
import { Skill } from '../../../core/models/skill.model';
import { Job } from '../../../core/models/job.model';

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
  private readonly cvProfileExtra = inject(CvProfileExtraService);
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

  protected extra(key: string): CvProfileExtraValue | undefined {
    return this.cvProfileExtra.get(this.cvData()?.profile, key);
  }

  protected extraBoolean(key: string): boolean {
    return this.cvProfileExtra.boolean(this.cvData()?.profile, key);
  }

  protected extraStringArray(key: string): string[] {
    return this.cvProfileExtra.stringArray(this.cvData()?.profile, key);
  }

  protected visibleSkills(skills: Skill[]): Skill[] {
    return skills.filter((skill) => skill.name.trim() !== '');
  }

  protected skillCategories(skills: Skill[]): string[] {
    return Array.from(new Set(this.visibleSkills(skills).map((skill) => this.skillCategoryLabel(skill))));
  }

  protected skillCategoryLabel(skill: Skill): string {
    return skill.expand?.category?.name || skill.type || 'Autre';
  }

  protected skillCategoryClass(skillOrCategory: Skill | string, skills: Skill[]): string {
    const category = typeof skillOrCategory === 'string' ? skillOrCategory : this.skillCategoryLabel(skillOrCategory);
    const categoryIndex = this.skillCategories(skills).indexOf(category);

    return `skill--tone-${Math.max(categoryIndex, 0) % 6}`;
  }

  protected chronologicalJobs(jobs: Job[]): Job[] {
    return jobs
      .map((job, index) => ({ job, index }))
      .sort((left, right) => {
        const leftDate = this.jobStartTime(left.job);
        const rightDate = this.jobStartTime(right.job);

        if (leftDate !== rightDate) {
          return leftDate - rightDate;
        }

        return (left.job.sortOrder ?? left.index) - (right.job.sortOrder ?? right.index);
      })
      .map(({ job }) => job);
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
    const defaultMode: SectionMode = this.extraBoolean('compactMode') ? 'compact' : 'full';
    this.sectionModes.set({
      projects: defaultMode,
      experience: defaultMode,
      skills: defaultMode,
      diplomas: defaultMode,
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

  private jobStartTime(job: Job): number {
    const date = this.pocketBaseService.toDate(job.startDate);

    return date && !Number.isNaN(date.getTime()) ? date.getTime() : Number.POSITIVE_INFINITY;
  }

  protected getVisibleProjects(projects: Project[]): Project[] {
    const visibleProjectCount = this.visibleProjectCount();
    const featuredProjectIds = this.extraStringArray('featuredProjectIds');
    const orderedProjects = featuredProjectIds.length
      ? [...projects].sort((left, right) => this.projectPriority(left.id, featuredProjectIds) - this.projectPriority(right.id, featuredProjectIds))
      : projects;

    return orderedProjects.slice(0, visibleProjectCount ?? orderedProjects.length);
  }

  private projectPriority(projectId: string, featuredProjectIds: string[]): number {
    const index = featuredProjectIds.indexOf(projectId);
    return index === -1 ? featuredProjectIds.length : index;
  }
}
