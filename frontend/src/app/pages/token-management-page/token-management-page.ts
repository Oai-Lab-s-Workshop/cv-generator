import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AiToken, CreatedAiTokenResult } from '../../core/models/ai-token.model';
import { PocketBaseService } from '../../core/services/pocketbase.service';
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
  readonly latestCreatedAiToken = signal<string | null>(null);
  readonly latestCreatedTokenDebug = signal<CreatedAiTokenResult | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly activeAiTokenMutationId = signal<string | null>(null);

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

    if (!label) {
      this.errorMessage.set('Le label de la cle API est obligatoire.');
      return;
    }

    this.isCreatingAiToken.set(true);
    this.errorMessage.set(null);
    this.latestCreatedAiToken.set(null);
    this.latestCreatedTokenDebug.set(null);

    try {
      const createdToken = await this.pocketBaseService.createCurrentUserAiToken({
        label,
        expiresAt: this.newAiTokenExpiresAt() ? new Date(this.newAiTokenExpiresAt()).toISOString() : null,
      });

      this.latestCreatedAiToken.set(createdToken.rawToken);
      this.latestCreatedTokenDebug.set(createdToken);
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
  }
}
