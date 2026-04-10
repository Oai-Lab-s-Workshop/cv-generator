import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CvProfile } from '../../core/models/cv-profile.model';
import { AuthService } from '../../core/services/auth.service';
import { PocketBaseService } from '../../core/services/pocketbase.service';
import { CV_TEMPLATE_OPTIONS } from '../../core/templates/cv-template-registry';
import { getErrorMessage } from '../../core/utils/error-message';

@Component({
  selector: 'app-home-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit {
  private readonly pocketBaseService = inject(PocketBaseService);
  private readonly authService = inject(AuthService);

  readonly generatedProfiles = signal<CvProfile[]>([]);
  readonly draftProfiles = signal<CvProfile[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly isSaving = signal<string | null>(null);
  readonly templateSelections = signal<Record<string, string>>({});
  readonly publicSelections = signal<Record<string, boolean>>({});
  readonly currentUser = this.authService.currentUser;
  readonly templateOptions = CV_TEMPLATE_OPTIONS;
  readonly currentUserName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : 'Authenticated user';
  });

  ngOnInit(): void {
    void this.loadProfiles();
  }

  private async loadProfiles(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const profiles = await this.pocketBaseService.getCurrentUserCvProfiles();
      const generatedProfiles = profiles.filter((profile) => !!profile.template);
      const draftProfiles = profiles.filter((profile) => !profile.template);

      this.templateSelections.set(
        Object.fromEntries(draftProfiles.map((profile) => [profile.id, this.templateOptions[0]?.id ?? 'classic'])),
      );
      this.publicSelections.set(
        Object.fromEntries([...generatedProfiles, ...draftProfiles].map((profile) => [profile.id, profile.public !== false])),
      );
      this.generatedProfiles.set(generatedProfiles);
      this.draftProfiles.set(draftProfiles);
    } catch (error: unknown) {
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  async assignTemplate(profile: CvProfile): Promise<void> {
    const template = this.templateSelections()[profile.id];

    if (!template) {
      this.errorMessage.set('Select a template first.');
      return;
    }

    this.isSaving.set(profile.id);
    this.errorMessage.set(null);

    try {
      await this.pocketBaseService.setTemplateForCurrentUserCvProfile(
        profile.id,
        template,
        this.publicSelections()[profile.id] ?? true,
      );
      await this.loadProfiles();
    } catch (error: unknown) {
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      this.isSaving.set(null);
    }
  }

  async togglePublic(profile: CvProfile, isPublic: boolean): Promise<void> {
    this.publicSelections.update((current) => ({ ...current, [profile.id]: isPublic }));

    if (!profile.template) {
      return;
    }

    this.isSaving.set(profile.id);
    this.errorMessage.set(null);

    try {
      await this.pocketBaseService.setPublicForCurrentUserCvProfile(profile.id, isPublic);
      await this.loadProfiles();
    } catch (error: unknown) {
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      this.isSaving.set(null);
    }
  }

  updateTemplateSelection(profileId: string, template: string): void {
    this.templateSelections.update((current) => ({ ...current, [profileId]: template }));
  }

  logout(): void {
    this.authService.logout();
    window.location.assign('/login');
  }
}
