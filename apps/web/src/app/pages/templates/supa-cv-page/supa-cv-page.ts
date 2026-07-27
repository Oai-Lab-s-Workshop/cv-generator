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
type ExperienceDescriptionMode = 'all' | 'highlighted' | 'none';
type ProjectDescriptionMode = 'full' | 'clamped' | 'hide-linked';

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
  readonly experienceDescriptions = signal<ExperienceDescriptionMode>('all');
  readonly projectDescriptionMode = signal<ProjectDescriptionMode>('full');
  readonly projectFit = signal<'auto' | 'fine'>('auto');
  readonly projectDescLineClamp = signal<number>(0);

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
    return skills.filter((skill) => skill.name.trim() !== '' && skill.type !== 'Language');
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

  protected highlightedJob(jobs: Job[]): Job | null {
    const ordered = this.chronologicalJobs(jobs);

    if (ordered.length === 0) {
      return null;
    }

    const current = ordered.filter((job) => !job.endDate);

    return current.length ? current[current.length - 1] : ordered[ordered.length - 1];
  }

  protected isJobDescriptionVisible(job: Job): boolean {
    const mode = this.experienceDescriptions();

    if (mode === 'all') {
      return true;
    }

    if (mode === 'none') {
      return false;
    }

    return job.id === this.highlightedJob(this.cvData()?.jobs ?? [])?.id;
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

    const compact = this.extraBoolean('compactMode');
    const defaultMode: SectionMode = compact ? 'compact' : 'full';

    // Clear any stale inline styles from a previous fine-fit run before
    // baseline measurement so every fitting run starts from a clean DOM.
    const projectsSection = this.resumeMain.nativeElement.querySelector('[data-projects-desc]') as HTMLElement | null;
    if (projectsSection) {
      projectsSection.style.maxHeight = '';
      projectsSection.style.overflow = '';
      const descs = projectsSection.querySelectorAll<HTMLElement>('.project-card__description');
      descs.forEach((d) => {
        d.style.maxHeight = '';
        d.style.removeProperty('--supa-project-desc-lines');
      });
    }

    this.visibleProjectCount.set(projectCount);
    this.experienceDescriptions.set(compact ? 'highlighted' : 'all');
    this.projectDescriptionMode.set(compact ? 'clamped' : 'full');
    this.projectFit.set('auto');
    this.projectDescLineClamp.set(0);
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

    // Escalation ladder, applied until the page fits. Ordered so project descriptions are
    // fine-tuned then trimmed/removed before the current/last job's description is ever hidden.
    const steps: Array<() => void> = [
      () => this.experienceDescriptions.set('highlighted'), // keep only current/last job description
      () => this.fitProjectsFine(), // fine-grained desc clamping using available A4 space
      // Coarse project-description steps are mutually exclusive with fine-fit mode
      // and only activate when fine-fit has been reset.
      () => { if (this.projectFit() !== 'fine') this.projectDescriptionMode.set('clamped'); },
      () => { if (this.projectFit() !== 'fine') this.projectDescriptionMode.set('hide-linked'); },
      () => this.experienceDescriptions.set('none'), // last resort: remove current/last job description
      () => this.sectionModes.update((modes) => ({ ...modes, skills: 'compact' })),
      () => this.sectionModes.update((modes) => ({ ...modes, diplomas: 'compact' })),
      () => this.fitProjectsSection(projectCount), // reduce visible project cards (floor 2)
    ];

    for (const applyStep of steps) {
      applyStep();
      this.changeDetectorRef.detectChanges();

      if (this.mainFits()) {
        return;
      }
    }
  }

  private fitProjectsFine(): void {
    const root = this.resumeRoot?.nativeElement;
    const main = this.resumeMain?.nativeElement;
    if (!root || !main) return;

    const descElements = this.getProjectDescElements(root);
    if (descElements.length === 0) return;

    // FIX 1: Set the generous fine clamp (12) BEFORE enabling fine mode
    // and calling detectChanges().  Never measure geometry with clamp 0.
    this.projectDescriptionMode.set('full');
    this.projectDescLineClamp.set(12);
    this.projectFit.set('fine');
    this.changeDetectorRef.detectChanges();

    const lineHeight = this.measureDescLineHeight(descElements[0]);
    const twoLinesPx = lineHeight * 2;

    // Measure page overflow.
    const rootTop = root.getBoundingClientRect().top;
    const a4HeightPx = this.mmToPx(this.pageHeightMm);
    const mainTop = main.getBoundingClientRect().top - rootTop;
    const mainBottom = mainTop + main.scrollHeight;
    const pageOverflow = Math.max(0, mainBottom - a4HeightPx - 2);

    const projectsSection = main.querySelector('[data-projects-desc]') as HTMLElement | null;
    if (!projectsSection) return;

    // FIX 2: Page already fits at 12 lines — return immediately keeping 12.
    if (pageOverflow <= 0) {
      return;
    }

    // ── Page overflows: calculate row-aware per-description budget. ──

    const sectionRect = projectsSection.getBoundingClientRect();
    const sectionHeight = sectionRect.height;

    // Section overhead: heading + padding + gap down to the project stack.
    const stackEl = projectsSection.querySelector('.project-stack') as HTMLElement | null;
    if (!stackEl) return;
    const sectionOverhead = stackEl.getBoundingClientRect().top - sectionRect.top;

    // Group cards by rendered row using rect.top with tolerance.
    // Cards in parallel columns share a row budget; a card's fixed-chrome
    // cost is measured directly (not from outer card rect minus desc rect,
    // which can include flex-row stretch on shorter cards).
    const ROW_TOLERANCE_PX = 2;
    const cards = Array.from(projectsSection.querySelectorAll('.card.project')) as HTMLElement[];

    const rows: Array<{
      cards: HTMLElement[];
      rowMaxFixed: number;
      cardFixed: number[];
      cardDescs: Array<HTMLElement | null>;
    }> = [];
    for (const card of cards) {
      const cardTop = card.getBoundingClientRect().top;

      // FIX 3: Measure fixed chrome by temporarily hiding the description
      // so the card's intrinsic fixed-chrome height is measured without
      // flex-row cross-axis stretch from a taller sibling card.
      const desc = card.querySelector('.project-card__description') as HTMLElement | null;
      const origDescDisplay = desc?.style.display ?? '';
      if (desc) desc.style.display = 'none';
      const fixedChrome = card.getBoundingClientRect().height;
      if (desc) desc.style.display = origDescDisplay;

      let matchedRow: (typeof rows)[number] | null = null;
      for (const row of rows) {
        const rowTop = row.cards[0].getBoundingClientRect().top;
        if (Math.abs(cardTop - rowTop) <= ROW_TOLERANCE_PX) {
          matchedRow = row;
          break;
        }
      }
      if (matchedRow) {
        matchedRow.cards.push(card);
        matchedRow.cardFixed.push(fixedChrome);
        matchedRow.cardDescs.push(desc);
        if (fixedChrome > matchedRow.rowMaxFixed) matchedRow.rowMaxFixed = fixedChrome;
      } else {
        rows.push({
          cards: [card],
          rowMaxFixed: fixedChrome,
          cardFixed: [fixedChrome],
          cardDescs: [desc],
        });
      }
    }

    const rowCount = rows.length;
    if (rowCount === 0) return;

    const rowGapPx = this.mmToPx(6);
    const totalRowGaps = (rowCount - 1) * rowGapPx;
    const totalRowFixedChrome = rows.reduce((s, r) => s + r.rowMaxFixed, 0);

    // Target section height = current section height - actual page overflow.
    const targetSectionHeight = Math.round(sectionHeight - pageOverflow);
    // Stack budget = target section height - measured section overhead.
    const stackBudget = targetSectionHeight - sectionOverhead;
    // Per-row budget = (stack budget - measured row gaps) / row count.
    const perRowBudget = (stackBudget - totalRowGaps) / rowCount;

    // Compute each card's candidate description height from its row budget.
    // effectiveLines is floored so max-height and line-clamp always align
    // to whole-line boundaries (FIX 1).
    interface Candidate {
      el: HTMLElement;
      fullScrollHeight: number;
      candidateHeight: number;
      effectiveLines: number;
    }
    const candidates: Candidate[] = [];
    for (const row of rows) {
      for (let i = 0; i < row.cards.length; i++) {
        const descEl = row.cardDescs[i];
        if (!descEl) continue;
        const candidateHeight = Math.max(0, perRowBudget - row.cardFixed[i]);
        const effectiveLines = candidateHeight > 0 ? Math.max(1, Math.floor(candidateHeight / lineHeight)) : 0;
        candidates.push({
          el: descEl,
          fullScrollHeight: descEl.scrollHeight,
          candidateHeight,
          effectiveLines,
        });
      }
    }

    // Fallback gate: NEVER reset fine mode solely because a budget is
    // below a minimum.  Coarse fallback is allowed only if at least one
    // description is both:
    //   - truly trimmed against its candidate allocation
    //     (full scrollHeight > candidate height + tolerance), and
    //   - candidate allocation is below 2 * computed lineHeight.
    const anyGateTrigger = candidates.some((c) => c.fullScrollHeight > c.candidateHeight + 1 && c.candidateHeight < twoLinesPx);

    if (anyGateTrigger) {
      // Gate fires: at least one description WOULD be trimmed below two
      // lines.  Reset fine mode so coarse project fallback can run.
      this.projectFit.set('auto');
      this.projectDescLineClamp.set(0);
      projectsSection.style.maxHeight = '';
      projectsSection.style.overflow = '';
      for (const el of descElements) {
        el.style.maxHeight = '';
        el.style.removeProperty('--supa-project-desc-lines');
      }
      return;
    }

    // FIX 1: Apply whole-line-aligned per-description constraints.
    // Each description receives a line-clamp custom property AND a
    // max-height set to exactly that many whole lines.  This guarantees
    // the ellipsis is rendered at the final complete line — a pixel
    // max-height that clips mid-line can hide content before line-clamp.
    const applyPerDesc = (linesPerDesc: Array<{ el: HTMLElement; lines: number }>) => {
      for (const d of linesPerDesc) {
        if (d.lines > 0) {
          const maxH = d.lines * lineHeight;
          d.el.style.setProperty('--supa-project-desc-lines', String(d.lines));
          d.el.style.maxHeight = `${maxH}px`;
        }
      }
      this.changeDetectorRef.detectChanges();
    };

    // FIX 2: Helper that sets section max-height and verifies scrollHeight
    // is within the target.  Accept fine only when the invariant holds;
    // clear the style otherwise.
    const acceptFineWithSectionMax = (): boolean => {
      if (targetSectionHeight > 0) {
        projectsSection.style.maxHeight = `${targetSectionHeight}px`;
        projectsSection.style.overflow = 'visible';
        this.changeDetectorRef.detectChanges();
        if (projectsSection.scrollHeight > targetSectionHeight + 1) {
          // Section budget violated — reset and fall through to bail.
          projectsSection.style.maxHeight = '';
          projectsSection.style.overflow = '';
          return false;
        }
      }
      return true;
    };

    const bailFineMode = () => {
      this.projectFit.set('auto');
      this.projectDescLineClamp.set(0);
      projectsSection.style.maxHeight = '';
      projectsSection.style.overflow = '';
      for (const el of descElements) {
        el.style.maxHeight = '';
        el.style.removeProperty('--supa-project-desc-lines');
      }
    };

    // Apply budget constraints and check fit.
    const linesPerDesc = candidates
      .filter((c) => c.effectiveLines > 0)
      .map((c) => ({ el: c.el, lines: c.effectiveLines }));
    applyPerDesc(linesPerDesc);

    if (this.mainFits()) {
      if (acceptFineWithSectionMax()) return;
      bailFineMode();
      return;
    }

    // Clamp reduction: reduce all descriptions' effective lines uniformly
    // from the current max down to 2, applying per-element custom property
    // and max-height at each step.  Stop at the first page fit.
    const maxEffectiveLines = Math.min(12, candidates.reduce((mx, c) => Math.max(mx, c.effectiveLines), 0));
    for (let lines = maxEffectiveLines - 1; lines >= 2; lines--) {
      for (const d of linesPerDesc) {
        const maxH = lines * lineHeight;
        d.el.style.setProperty('--supa-project-desc-lines', String(lines));
        d.el.style.maxHeight = `${maxH}px`;
      }
      this.projectDescLineClamp.set(lines);
      this.changeDetectorRef.detectChanges();
      if (this.mainFits()) {
        if (acceptFineWithSectionMax()) return;
        break;
      }
    }

    // At 2 lines, the page still overflows.  Re-evaluate the T3 gate
    // from the actual rendered state after all constraints are applied.
    this.changeDetectorRef.detectChanges();
    const anyTrimmedBelowTwo = descElements.some((el) => {
      const trimmed = el.scrollHeight > el.clientHeight + 1;
      return trimmed && el.clientHeight < twoLinesPx;
    });

    if (anyTrimmedBelowTwo) {
      bailFineMode();
    }
    // If the gate did not fire, fine mode stays active at 2 lines.
    // The outer ladder will continue with non-project steps.
  }

  private getProjectDescElements(root: HTMLElement): HTMLElement[] {
    if (typeof (root as Node & { querySelectorAll?: unknown }).querySelectorAll !== 'function') {
      return [];
    }
    return Array.from(root.querySelectorAll<HTMLElement>('.project-card__description'));
  }

  private measureDescLineHeight(el: HTMLElement): number {
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
    return Number.isNaN(lineHeight) ? parseFloat(getComputedStyle(el).fontSize) * 1.2 : lineHeight;
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
