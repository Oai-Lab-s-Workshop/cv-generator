import { NgComponentOutlet } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  input,
  signal,
} from '@angular/core';
import { environment } from '../../../../environments/environment';
import { getTemplatePreviewData, TemplatePreviewSeedData } from '../../../core/data/template-preview-fr.data';
import { CvData } from '../../../core/models/cv-data.model';
import { CvTemplateOption, CV_TEMPLATE_OPTIONS } from '../../../core/templates/cv-template-registry';

type TemplatePreviewCard = CvTemplateOption & { previewData: CvData };

@Component({
  selector: 'app-template-preview-list',
  imports: [NgComponentOutlet],
  templateUrl: './template-preview-list.html',
  styleUrl: './template-preview-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatePreviewList implements OnInit, AfterViewInit, OnDestroy {
  private readonly previewSeedUrl = environment.previewSeedUrl;
  private animationFrameId: number | null = null;
  private autoLoopStartTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private scrollDirection = 1;

  @ViewChild('scrollContainer') private readonly scrollContainer?: ElementRef<HTMLElement>;

  readonly allowA4Toggle = input(true);
  readonly forceA4 = input(false);
  readonly autoLoop = input(false);
  readonly templateLimit = input<number | null>(null);
  readonly showChrome = input(true);

  readonly previewCards = signal<TemplatePreviewCard[]>([]);
  readonly a4PreviewTemplateIds = signal<ReadonlySet<string>>(new Set<string>());
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const response = await fetch(this.previewSeedUrl);

      if (!response.ok) {
        throw new Error('Impossible de charger les donnees de previsualisation.');
      }

      const seed = (await response.json()) as TemplatePreviewSeedData;
      const templates = this.getTemplatesForPreview();

      this.previewCards.set(
        templates.map((template) => ({
          ...template,
          previewData: getTemplatePreviewData(seed, template.id),
        })),
      );
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossible de charger les donnees de previsualisation.');
    } finally {
      this.isLoading.set(false);
      this.scheduleAutoLoopStart();
    }
  }

  ngAfterViewInit(): void {
    this.scheduleAutoLoopStart();
  }

  ngOnDestroy(): void {
    if (this.autoLoopStartTimeoutId !== null) {
      clearTimeout(this.autoLoopStartTimeoutId);
      this.autoLoopStartTimeoutId = null;
    }

    this.stopAutoLoop();
  }

  toggleA4Preview(templateId: string): void {
    if (!this.allowA4Toggle()) {
      return;
    }

    this.a4PreviewTemplateIds.update((templateIds) => {
      const nextTemplateIds = new Set(templateIds);

      if (nextTemplateIds.has(templateId)) {
        nextTemplateIds.delete(templateId);
      } else {
        nextTemplateIds.add(templateId);
      }

      return nextTemplateIds;
    });
  }

  isA4PreviewEnabled(templateId: string): boolean {
    return this.forceA4() || this.a4PreviewTemplateIds().has(templateId);
  }

  private getTemplatesForPreview(): CvTemplateOption[] {
    const limit = this.templateLimit();

    if (!limit || limit >= CV_TEMPLATE_OPTIONS.length) {
      return CV_TEMPLATE_OPTIONS;
    }

    return [...CV_TEMPLATE_OPTIONS]
      .map((template) => ({ template, sort: Math.random() }))
      .sort((left, right) => left.sort - right.sort)
      .slice(0, Math.max(0, limit))
      .map(({ template }) => template);
  }

  private scheduleAutoLoopStart(): void {
    if (this.autoLoopStartTimeoutId !== null) {
      clearTimeout(this.autoLoopStartTimeoutId);
    }

    this.autoLoopStartTimeoutId = setTimeout(() => {
      this.autoLoopStartTimeoutId = null;
      this.startAutoLoopIfNeeded();
    });
  }

  private startAutoLoopIfNeeded(): void {
    if (!this.autoLoop() || this.isLoading() || this.errorMessage() || this.animationFrameId !== null) {
      return;
    }

    if (typeof requestAnimationFrame === 'undefined') {
      return;
    }

    const container = this.scrollContainer?.nativeElement;

    if (!container || container.scrollHeight <= container.clientHeight) {
      return;
    }

    const step = () => {
      const maxScrollTop = container.scrollHeight - container.clientHeight;

      if (maxScrollTop <= 0) {
        this.animationFrameId = requestAnimationFrame(step);
        return;
      }

      if (container.scrollTop >= maxScrollTop) {
        this.scrollDirection = -1;
      } else if (container.scrollTop <= 0) {
        this.scrollDirection = 1;
      }

      container.scrollTop += this.scrollDirection * 0.35;
      this.animationFrameId = requestAnimationFrame(step);
    };

    this.animationFrameId = requestAnimationFrame(step);
  }

  private stopAutoLoop(): void {
    if (this.animationFrameId === null) {
      return;
    }

    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }
}
