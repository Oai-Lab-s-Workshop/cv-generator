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
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { CvData } from '../../../core/models/cv-data.model';
import { Degree } from '../../../core/models/degree.model';
import { Job } from '../../../core/models/job.model';
import { Project } from '../../../core/models/project.model';
import { Skill } from '../../../core/models/skill.model';
import { PocketBaseService } from '../../../core/services/pocketbase.service';
import { getErrorMessage } from '../../../core/utils/error-message';

type BentoMode = 'full' | 'compact' | 'tight';

interface ExperienceItem {
  id: string;
  type: 'freelance' | 'sideproject' | 'work project';
  dateRange: string;
  company: string;
  title: string;
  description: string | null;
  skills: Skill[];
  url?: string;
  isProject: boolean;
}

@Component({
  selector: 'app-bento-cv-page',
  templateUrl: './bento-cv-page.html',
  styleUrl: './bento-cv-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BentoCvPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly pocketBaseService = inject(PocketBaseService);
  private readonly injector = inject(Injector);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly pageHeightMm = 297;
  private requestId = 0;
  private fitFrameId: number | null = null;

  @ViewChild('bentoSheet') private readonly bentoSheet?: ElementRef<HTMLElement>;

  readonly cvProfileId = input<string | null>(null);
  readonly previewData = input<CvData | null>(null);
  readonly cvData = signal<CvData | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly mode = signal<BentoMode>('full');
  readonly visibleJobCount = signal<number | null>(null);

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

  protected getDisplayName(data: CvData): string {
    const userName = [data.user?.firstName, data.user?.lastName].filter(Boolean).join(' ').trim();
    return userName || data.profile.profileName || 'Curriculum Vitae';
  }

  protected getInitials(data: CvData): string {
    const name = this.getDisplayName(data);
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  protected getRoleLines(data: CvData): string[] {
    const parts = data.profile.profileName
      .split(/[\/|,]+/)
      .map((part) => part.trim())
      .filter(Boolean);

    return parts.length > 0 ? parts.slice(0, 2) : ['Profil professionnel'];
  }

  protected getExperienceYears(jobs: Job[]): number {
    const starts = jobs
      .map((job) => this.pocketBaseService.toDate(job.startDate))
      .filter((date): date is Date => !!date && !Number.isNaN(date.getTime()));

    if (starts.length === 0) {
      return Math.max(1, Math.min(9, jobs.length));
    }

    const earliest = starts.reduce((oldest, date) => (date < oldest ? date : oldest));
    const years = new Date().getFullYear() - earliest.getFullYear();

    return Math.max(1, years);
  }

  protected getToolSkills(skills: Skill[]): Skill[] {
    const preferred = skills.filter((skill) => skill.icon || skill.type?.toLowerCase() === 'technical');
    return (preferred.length ? preferred : skills).slice(0, 3);
  }

  protected getStrengthSkills(skills: Skill[]): Skill[] {
    const strengths = skills.filter((skill) => skill.type?.toLowerCase() !== 'language');
    return (strengths.length ? strengths : skills).slice(0, this.mode() === 'tight' ? 5 : 7);
  }

  protected getExperienceItems(data: CvData): ExperienceItem[] {
    const jobItems: ExperienceItem[] = data.jobs.map((job) => ({
      id: `job-${job.id}`,
      type: job.type,
      dateRange: this.getDateRange(job),
      company: job.company,
      title: job.position || job.label,
      description: job.responsibilities ?? null,
      skills: this.getJobSkills(job, data.skills),
      isProject: false,
    }));

    const projectItems: ExperienceItem[] = data.projects.map((project) => ({
      id: `project-${project.id}`,
      type: project.type ?? 'sideproject',
      dateRange: this.getDate(project.date),
      company: '',
      title: project.name,
      description: project.description ?? null,
      skills: [],
      url: project.url || undefined,
      isProject: true,
    }));

    return [...jobItems, ...projectItems];
  }

  protected getVisibleExperienceItems(data: CvData): ExperienceItem[] {
    const items = this.getExperienceItems(data);
    const count = this.visibleJobCount() ?? items.length;
    return items.slice(0, count);
  }

  protected getJobSkills(job: Job, skills: Skill[]): Skill[] {
    const skillIds = new Set(job.skills ?? []);
    const relatedSkills = skills.filter((skill) => skillIds.has(skill.id));

    if (relatedSkills.length > 0) {
      return relatedSkills.slice(0, this.mode() === 'full' ? 3 : 2);
    }

    return skills.filter((skill) => skill.type?.toLowerCase() !== 'language').slice(0, 2);
  }

  protected getVisibleDegrees(degrees: Degree[]): Degree[] {
    return degrees.slice(0, this.mode() === 'tight' ? 3 : 4);
  }

  protected getDateRange(job: Job): string {
    const start = this.getDate(job.startDate) || 'Debut';
    const end = job.endDate ? this.getDate(job.endDate) : 'Aujourd\'hui';
    return `${start} - ${end}`;
  }

  protected getDate(dateStr: string | null | undefined): string {
    const date = this.pocketBaseService.toDate(dateStr);

    if (!date || Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
  }

  protected getProfileUrl(data: CvData): string {
    if (data.user?.website) {
      return data.user.website;
    }

    if (typeof window === 'undefined') {
      return data.profile.slug;
    }

    return `${window.location.origin}/${data.profile.slug}`;
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
      this.fitToA4();
    });
  }

  private fitToA4(): void {
    const data = this.cvData();
    const jobCount = data?.jobs.length ?? 0;
    const projectCount = data?.projects.length ?? 0;
    const experienceCount = jobCount + projectCount;

    this.mode.set('full');
    this.visibleJobCount.set(experienceCount);
    this.changeDetectorRef.detectChanges();

    if (this.sheetFits()) {
      return;
    }

    this.mode.set('compact');
    this.changeDetectorRef.detectChanges();

    if (this.sheetFits()) {
      return;
    }

    this.mode.set('tight');
    this.changeDetectorRef.detectChanges();

    let visibleItems = this.visibleJobCount() ?? experienceCount;
    const minimumVisibleItems = Math.min(4, experienceCount);

    while (!this.sheetFits() && visibleItems > minimumVisibleItems) {
      visibleItems -= 1;
      this.visibleJobCount.set(visibleItems);
      this.changeDetectorRef.detectChanges();
    }
  }

  private sheetFits(): boolean {
    const sheetElement = this.bentoSheet?.nativeElement;

    if (!sheetElement) {
      return true;
    }

    return sheetElement.scrollHeight <= this.mmToPx(this.pageHeightMm) + 2;
  }

  private mmToPx(mm: number): number {
    return (mm * 96) / 25.4;
  }
}
