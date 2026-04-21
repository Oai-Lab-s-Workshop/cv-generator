import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  private readonly router = inject(Router);

  readonly generatedProfiles = signal<CvProfile[]>([]);
  readonly draftProfiles = signal<CvProfile[]>([]);
  readonly isLoading = signal(true);
  readonly isCreating = signal(false);
  readonly newProfileName = signal('');
  readonly errorMessage = signal<string | null>(null);
  readonly isSaving = signal<string | null>(null);
  readonly templateSelections = signal<Record<string, string>>({});
  readonly publicSelections = signal<Record<string, boolean>>({});
  readonly currentUser = this.authService.currentUser;
  readonly templateOptions = CV_TEMPLATE_OPTIONS;
  readonly currentUserName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : 'Utilisateur authentifie';
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
      const allProfiles = [...generatedProfiles, ...draftProfiles];

      this.templateSelections.set(
        Object.fromEntries(allProfiles.map((profile) => [profile.id, profile.template || this.templateOptions[0]?.id || 'classic'])),
      );
      this.publicSelections.set(
        Object.fromEntries(allProfiles.map((profile) => [profile.id, profile.public !== false])),
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

  async createProfile(): Promise<void> {
    const profileName = this.newProfileName().trim();

    if (!profileName) {
      this.errorMessage.set('Le nom du profil est obligatoire.');
      return;
    }

    this.isCreating.set(true);
    this.errorMessage.set(null);

    try {
      const profile = await this.pocketBaseService.createCurrentUserCvProfile(profileName);
      this.newProfileName.set('');
      await this.router.navigate(['/home/profiles', profile.id, 'edit']);
    } catch (error: unknown) {
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      this.isCreating.set(false);
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
