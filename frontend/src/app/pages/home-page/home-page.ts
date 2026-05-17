import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AiToken } from '../../core/models/ai-token.model';
import { CvProfile } from '../../core/models/cv-profile.model';
import { AuthService } from '../../core/services/auth.service';
import { PocketBaseService } from '../../core/services/pocketbase.service';
import { CV_TEMPLATE_OPTIONS } from '../../core/templates/cv-template-registry';
import { getErrorMessage } from '../../core/utils/error-message';
import { Navbar } from '../../shared/components/navbar/navbar';

@Component({
  selector: 'app-home-page',
  imports: [FormsModule, Navbar, RouterLink],
  templateUrl: './home-page.html',
  styleUrls: ['../../styles/home-shared.css', './home-page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit {
  private readonly pocketBaseService = inject(PocketBaseService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly profiles = signal<CvProfile[]>([]);
  readonly aiTokens = signal<AiToken[]>([]);
  readonly isLoading = signal(true);
  readonly isLoadingAiTokens = signal(true);
  readonly isCreating = signal(false);
  readonly newProfileLabel = signal('');
  readonly newProfileName = signal('');
  readonly newProfileTemplate = signal(CV_TEMPLATE_OPTIONS[0]?.id || 'classic');
  readonly errorMessage = signal<string | null>(null);
  readonly isSaving = signal<string | null>(null);
  readonly templateSelections = signal<Record<string, string>>({});
  readonly publicSelections = signal<Record<string, boolean>>({});
  readonly currentUser = this.authService.currentUser;
  readonly templateOptions = CV_TEMPLATE_OPTIONS;
  readonly totalProfileCount = computed(() => this.profiles().length);
  readonly publicProfileCount = computed(
    () => this.profiles().filter((profile) => Boolean(profile.template) && profile.public !== false).length,
  );
  readonly privateProfileCount = computed(
    () => this.profiles().filter((profile) => Boolean(profile.template) && profile.public === false).length,
  );
  readonly activeAiTokenCount = computed(() => this.aiTokens().filter((token) => token.status === 'active').length);
  readonly currentUserName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : 'Utilisateur authentifie';
  });

  ngOnInit(): void {
    void this.loadProfiles();
    void this.loadAiTokens();
  }

  private async loadProfiles(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const profiles = await this.pocketBaseService.getCurrentUserCvProfiles();

      this.templateSelections.set(
        Object.fromEntries(profiles.map((profile) => [profile.id, profile.template || this.templateOptions[0]?.id || 'classic'])),
      );
      this.publicSelections.set(
        Object.fromEntries(profiles.map((profile) => [profile.id, profile.public !== false])),
      );
      this.profiles.set(profiles);
    } catch (error: unknown) {
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadAiTokens(): Promise<void> {
    this.isLoadingAiTokens.set(true);

    try {
      this.aiTokens.set(await this.pocketBaseService.getCurrentUserAiTokens());
    } catch {
      this.aiTokens.set([]);
    } finally {
      this.isLoadingAiTokens.set(false);
    }
  }

  getTemplateLabel(templateId?: string): string {
    if (!templateId) {
      return 'Template requis';
    }

    return this.templateOptions.find((template) => template.id === templateId)?.label ?? templateId;
  }

  getVisibilityLabel(profile: CvProfile): string {
    if (!profile.template) {
      return 'Indisponible';
    }

    return profile.public === false ? 'Prive' : 'Public';
  }

  getVisibilityTone(profile: CvProfile): 'live' | 'private' | 'missing' {
    if (!profile.template) {
      return 'missing';
    }

    return profile.public === false ? 'private' : 'live';
  }

  async changeTemplate(profile: CvProfile, template: string): Promise<void> {
    this.templateSelections.update((current) => ({ ...current, [profile.id]: template }));

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
    const label = this.newProfileLabel().trim();
    const profileName = this.newProfileName().trim();

    if (!label) {
      this.errorMessage.set('Le label est obligatoire.');
      return;
    }

    if (!profileName) {
      this.errorMessage.set('Le nom du profil est obligatoire.');
      return;
    }

    const template = this.newProfileTemplate();
    if (!template) {
      this.errorMessage.set('Le template est obligatoire.');
      return;
    }

    this.isCreating.set(true);
    this.errorMessage.set(null);

    try {
      const profile = await this.pocketBaseService.createCurrentUserCvProfile(label, profileName, template);
      this.newProfileLabel.set('');
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

}
