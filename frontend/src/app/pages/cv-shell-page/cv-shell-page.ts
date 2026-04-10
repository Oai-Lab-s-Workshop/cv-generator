import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, Injector, input, OnInit, signal } from '@angular/core';
import { CvProfile } from '../../core/models/cv-profile.model';
import { PocketBaseService } from '../../core/services/pocketbase.service';
import { CV_TEMPLATE_OPTIONS_BY_ID } from '../../core/templates/cv-template-registry';

@Component({
  selector: 'app-cv-shell-page',
  imports: [NgComponentOutlet],
  templateUrl: './cv-shell-page.html',
  styleUrl: './cv-shell-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvShellPage implements OnInit {
  private readonly pocketBaseService = inject(PocketBaseService);
  private readonly injector = inject(Injector);
  private requestId = 0;

  readonly slug = input.required<string>();
  readonly profile = signal<CvProfile | null>(null);

  ngOnInit(): void {
    effect(
      () => {
        void this.loadProfile(this.slug());
      },
      { injector: this.injector },
    );
  }

  readonly templateComponent = computed(() => {
    const profile = this.profile();
    const templateId = profile?.template;

    if (!templateId) {
      return null;
    }

    return CV_TEMPLATE_OPTIONS_BY_ID.get(templateId)?.component ?? null;
  });

  private async loadProfile(slug: string): Promise<void> {
    const currentRequestId = ++this.requestId;

    try {
      const profile = await this.pocketBaseService.getCvProfileBySlug(slug);

      if (currentRequestId !== this.requestId) {
        return;
      }

      this.profile.set(profile);
    } catch {
      if (currentRequestId !== this.requestId) {
        return;
      }

      this.profile.set(null);
    }
  }

  //TODO: add a generate pdf button only visible when authenticated and profile belongs to the user
}
