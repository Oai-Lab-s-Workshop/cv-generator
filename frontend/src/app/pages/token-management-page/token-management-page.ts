import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AiToken } from '../../core/models/ai-token.model';
import { PocketBaseService } from '../../core/services/pocketbase.service';
import { CV_TEMPLATE_OPTIONS } from '../../core/templates/cv-template-registry';
import { getErrorMessage } from '../../core/utils/error-message';

@Component({
  selector: 'app-token-management-page',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './token-management-page.html',
  styleUrl: './token-management-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenManagementPage implements OnInit {
  private readonly pocketBaseService = inject(PocketBaseService);

  readonly aiTokens = signal<AiToken[]>([]);
  readonly isLoadingAiTokens = signal(true);
  readonly isCreatingAiToken = signal(false);
  readonly newAiTokenLabel = signal('Assistant principal');
  readonly newAiTokenExpiresAt = signal('');
  readonly newAiTokenCanChooseTemplate = signal(true);
  readonly newAiTokenAllowedTemplates = signal(CV_TEMPLATE_OPTIONS.map((template) => template.id));
  readonly newAiTokenMaxProfileCreates = signal('');
  readonly latestCreatedAiToken = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly activeAiTokenMutationId = signal<string | null>(null);
  readonly templateOptions = CV_TEMPLATE_OPTIONS;

  ngOnInit(): void {
    void this.loadAiTokens();
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

  setAiTokenTemplateChoice(canChooseTemplate: boolean): void {
    this.newAiTokenCanChooseTemplate.set(canChooseTemplate);

    if (!canChooseTemplate) {
      this.newAiTokenAllowedTemplates.update((current) => current.slice(0, 1));
    } else if (this.newAiTokenAllowedTemplates().length === 0) {
      this.newAiTokenAllowedTemplates.set(CV_TEMPLATE_OPTIONS.map((template) => template.id));
    }
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

  private resetAiTokenForm(): void {
    this.newAiTokenLabel.set('Assistant principal');
    this.newAiTokenExpiresAt.set('');
    this.newAiTokenCanChooseTemplate.set(true);
    this.newAiTokenAllowedTemplates.set(CV_TEMPLATE_OPTIONS.map((template) => template.id));
    this.newAiTokenMaxProfileCreates.set('');
  }
}
