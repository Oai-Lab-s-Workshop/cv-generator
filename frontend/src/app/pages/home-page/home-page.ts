import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AiToken } from '../../core/models/ai-token.model';
import { CvProfile } from '../../core/models/cv-profile.model';
import { AuthService } from '../../core/services/auth.service';
import { PocketBaseService } from '../../core/services/pocketbase.service';
import { CV_TEMPLATE_OPTIONS } from '../../core/templates/cv-template-registry';
import { getErrorMessage } from '../../core/utils/error-message';

@Component({
  selector: 'app-home-page',
  imports: [DatePipe, FormsModule, RouterLink],
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
  readonly aiTokens = signal<AiToken[]>([]);
  readonly isLoading = signal(true);
  readonly isLoadingAiTokens = signal(true);
  readonly isCreating = signal(false);
  readonly isCreatingAiToken = signal(false);
  readonly newProfileName = signal('');
  readonly newAiTokenLabel = signal('Assistant principal');
  readonly newAiTokenExpiresAt = signal('');
  readonly newAiTokenCanChooseTemplate = signal(true);
  readonly newAiTokenAllowedTemplates = signal(CV_TEMPLATE_OPTIONS.map((template) => template.id));
  readonly newAiTokenMaxProfileCreates = signal('');
  readonly latestCreatedAiToken = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly isSaving = signal<string | null>(null);
  readonly activeAiTokenMutationId = signal<string | null>(null);
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
    void this.loadAiTokens();
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

  private async loadAiTokens(): Promise<void> {
    this.isLoadingAiTokens.set(true);

    try {
      this.aiTokens.set(await this.pocketBaseService.getCurrentUserAiTokens());
    } catch (error: unknown) {
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      this.isLoadingAiTokens.set(false);
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

  async createAiToken(): Promise<void> {
    const label = this.newAiTokenLabel().trim();
    const allowedTemplates = this.newAiTokenAllowedTemplates();

    if (!label) {
      this.errorMessage.set('Le label du token est obligatoire.');
      return;
    }

    if (allowedTemplates.length === 0) {
      this.errorMessage.set('Selectionnez au moins un template autorise.');
      return;
    }

    this.isCreatingAiToken.set(true);
    this.errorMessage.set(null);

    try {
      const { rawToken } = await this.pocketBaseService.createCurrentUserAiToken({
        label,
        expiresAt: this.newAiTokenExpiresAt() ? new Date(this.newAiTokenExpiresAt()).toISOString() : null,
        canChooseTemplate: this.newAiTokenCanChooseTemplate(),
        allowedTemplates,
        maxProfileCreates: this.newAiTokenMaxProfileCreates() ? Number(this.newAiTokenMaxProfileCreates()) : null,
      });

      this.latestCreatedAiToken.set(rawToken);
      this.resetAiTokenForm();
      await this.loadAiTokens();
    } catch (error: unknown) {
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      this.isCreatingAiToken.set(false);
    }
  }

  async revokeAiToken(token: AiToken): Promise<void> {
    this.activeAiTokenMutationId.set(token.id);
    this.errorMessage.set(null);

    try {
      await this.pocketBaseService.revokeCurrentUserAiToken(token.id);
      await this.loadAiTokens();
    } catch (error: unknown) {
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      this.activeAiTokenMutationId.set(null);
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

  setAiTokenTemplateChoice(canChooseTemplate: boolean): void {
    this.newAiTokenCanChooseTemplate.set(canChooseTemplate);

    if (!canChooseTemplate) {
      this.newAiTokenAllowedTemplates.update((current) => current.slice(0, 1));
    } else if (this.newAiTokenAllowedTemplates().length === 0) {
      this.newAiTokenAllowedTemplates.set(CV_TEMPLATE_OPTIONS.map((template) => template.id));
    }
  }

  toggleAiTokenTemplate(templateId: string, checked: boolean): void {
    if (this.newAiTokenCanChooseTemplate()) {
      this.newAiTokenAllowedTemplates.update((current) => {
        if (checked) {
          return current.includes(templateId) ? current : [...current, templateId];
        }

        return current.filter((currentTemplateId) => currentTemplateId !== templateId);
      });

      return;
    }

    this.newAiTokenAllowedTemplates.set(checked ? [templateId] : []);
  }

  isAiTokenTemplateSelected(templateId: string): boolean {
    return this.newAiTokenAllowedTemplates().includes(templateId);
  }

  formatAiTokenTemplateScope(token: AiToken): string {
    if (!token.allowedTemplates?.length) {
      return 'Aucun template autorise';
    }

    return token.canChooseTemplate
      ? `Choix IA parmi ${token.allowedTemplates.join(', ')}`
      : `Template fixe: ${token.allowedTemplates[0]}`;
  }

  async copyLatestAiToken(): Promise<void> {
    const rawToken = this.latestCreatedAiToken();

    if (!rawToken || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(rawToken);
  }

  logout(): void {
    this.authService.logout();
    window.location.assign('/login');
  }

  private resetAiTokenForm(): void {
    this.newAiTokenLabel.set('Assistant principal');
    this.newAiTokenExpiresAt.set('');
    this.newAiTokenCanChooseTemplate.set(true);
    this.newAiTokenAllowedTemplates.set(CV_TEMPLATE_OPTIONS.map((template) => template.id));
    this.newAiTokenMaxProfileCreates.set('');
  }
}
