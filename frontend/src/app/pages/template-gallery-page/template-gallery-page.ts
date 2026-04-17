import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { getTemplatePreviewData, TemplatePreviewSeedData } from '../../core/data/template-preview-fr.data';
import { CV_TEMPLATE_OPTIONS } from '../../core/templates/cv-template-registry';

@Component({
  selector: 'app-template-gallery-page',
  imports: [NgComponentOutlet, RouterLink],
  templateUrl: './template-gallery-page.html',
  styleUrl: './template-gallery-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateGalleryPage implements OnInit {
  readonly previewCards = signal<Array<(typeof CV_TEMPLATE_OPTIONS)[number] & { previewData: ReturnType<typeof getTemplatePreviewData> }>>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const response = await fetch('/app-data/seed.json');

      if (!response.ok) {
        throw new Error('Impossible de charger les donnees de previsualisation.');
      }

      const seed = (await response.json()) as TemplatePreviewSeedData;
      this.previewCards.set(
        CV_TEMPLATE_OPTIONS.map((template) => ({
          ...template,
          previewData: getTemplatePreviewData(seed, template.id),
        })),
      );
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Impossible de charger les donnees de previsualisation.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
