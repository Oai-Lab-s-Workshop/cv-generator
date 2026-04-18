import { DOCUMENT, NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, Injector, input, OnInit, signal } from '@angular/core';
import { CvProfile } from '../../core/models/cv-profile.model';
import { PocketBaseService } from '../../core/services/pocketbase.service';
import { CV_TEMPLATE_OPTIONS_BY_ID } from '../../core/templates/cv-template-registry';
import { AuthService } from '../../core/services/auth.service';
import { RouterLink } from '@angular/router';
import { HtmlPdfExportService } from '../../core/services/html-pdf-export.service';

@Component({
  selector: 'app-cv-shell-page',
  imports: [NgComponentOutlet, RouterLink],
  templateUrl: './cv-shell-page.html',
  styleUrl: './cv-shell-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvShellPage implements OnInit {
  private readonly pocketBaseService = inject(PocketBaseService);
  private readonly authService = inject(AuthService);
  private readonly htmlPdfExportService = inject(HtmlPdfExportService);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private requestId = 0;

  readonly slug = input.required<string>();
  readonly profile = signal<CvProfile | null>(null);
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly isPreviewMode = signal(false);
  readonly isAdminBarDismissed = signal(false);
  readonly isExportingPdf = signal(false);
  readonly statusMessage = signal<string | null>(null);
  readonly statusTone = signal<'info' | 'error'>('info');

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

  readonly templateLabel = computed(() => {
    const templateId = this.profile()?.template;

    if (!templateId) {
      return null;
    }

    return CV_TEMPLATE_OPTIONS_BY_ID.get(templateId)?.label ?? templateId;
  });

  readonly isOwner = computed(() => {
    const profile = this.profile();
    const currentUserId = this.authService.getCurrentUserId();

    return !!profile && !!currentUserId && profile.user === currentUserId;
  });

  readonly showAdminBar = computed(() => this.isOwner() && !this.isAdminBarDismissed());

  protected togglePreviewMode(): void {
    this.isPreviewMode.update((value) => !value);
    this.statusTone.set('info');
    this.statusMessage.set(this.isPreviewMode() ? 'Preview mode enabled.' : 'Preview mode disabled.');
  }

  protected printCv(): void {
    window.print();
  }

  protected async downloadPdf(): Promise<void> {
    const profile = this.profile();
    const documentElement = this.document.getElementById('cv-document');

    if (!profile || !documentElement || this.isExportingPdf()) {
      return;
    }

    this.isExportingPdf.set(true);
    this.statusTone.set('info');
    this.statusMessage.set('Preparing PDF export...');

    try {
      await this.htmlPdfExportService.download(documentElement, `${profile.slug}.pdf`);
      this.statusMessage.set('PDF downloaded.');
    } catch {
      this.statusTone.set('error');
      this.statusMessage.set('Unable to export the current HTML/CSS rendering.');
    } finally {
      this.isExportingPdf.set(false);
    }
  }

  protected dismissAdminBar(): void {
    this.isAdminBarDismissed.set(true);
    this.statusMessage.set(null);
  }

  private async loadProfile(slug: string): Promise<void> {
    const currentRequestId = ++this.requestId;

    try {
      const profile = await this.pocketBaseService.getCvProfileBySlug(slug);

      if (currentRequestId !== this.requestId) {
        return;
      }

      this.profile.set(profile);
      this.statusMessage.set(null);
    } catch {
      if (currentRequestId !== this.requestId) {
        return;
      }

      this.profile.set(null);
    }
  }
}
