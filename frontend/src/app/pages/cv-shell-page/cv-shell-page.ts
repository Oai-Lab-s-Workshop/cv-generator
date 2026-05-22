import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, Injector, input, OnInit, signal } from '@angular/core';
import { CvProfile } from '../../core/models/cv-profile.model';
import { PocketBaseService } from '../../core/services/pocketbase.service';
import { CV_TEMPLATE_OPTIONS_BY_ID } from '../../core/templates/cv-template-registry';
import { AuthService } from '../../core/services/auth.service';
import { RouterLink } from '@angular/router';

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
  private readonly injector = inject(Injector);
  private requestId = 0;

  readonly slug = input.required<string>();
  readonly profile = signal<CvProfile | null>(null);
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly isPreviewMode = signal(false);
  readonly isAdminBarOpen = signal(false);
  readonly isAdminBarDismissed = signal(false);
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

  protected toggleAdminBar(): void {
    this.isAdminBarOpen.update((value) => !value);
  }

  protected closeAdminBar(): void {
    this.isAdminBarOpen.set(false);
  }

  protected togglePreviewMode(): void {
    this.isPreviewMode.update((value) => !value);
    this.statusTone.set('info');
    this.statusMessage.set(this.isPreviewMode() ? 'Preview mode enabled.' : 'Preview mode disabled.');
  }

  protected printCv(): void {
    window.print();
  }

  protected dismissAdminBar(): void {
    this.closeAdminBar();
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
