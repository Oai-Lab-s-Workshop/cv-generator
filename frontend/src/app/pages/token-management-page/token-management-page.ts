import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiToken, CreatedAiTokenResult } from '../../core/models/ai-token.model';
import { AuthService } from '../../core/services/auth.service';
import { PocketBaseService } from '../../core/services/pocketbase.service';
import { getErrorMessage } from '../../core/utils/error-message';
import { Navbar } from '../../shared/components/navbar/navbar';

@Component({
  selector: 'app-token-management-page',
  imports: [DatePipe, FormsModule, Navbar],
  templateUrl: './token-management-page.html',
  styleUrls: ['../../styles/home-shared.css', './token-management-page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenManagementPage implements OnInit {
  private readonly pocketBaseService = inject(PocketBaseService);
  private readonly authService = inject(AuthService);

  readonly aiTokens = signal<AiToken[]>([]);
  readonly isLoadingAiTokens = signal(true);
  readonly isCreatingAiToken = signal(false);
  readonly newAiTokenLabel = signal('Assistant principal');
  readonly newAiTokenExpiresAt = signal('');
  readonly latestCreatedAiToken = signal<string | null>(null);
  readonly latestCreatedTokenDebug = signal<CreatedAiTokenResult | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly activeAiTokenMutationId = signal<string | null>(null);
  readonly currentUser = this.authService.currentUser;
  readonly currentUserName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : 'Utilisateur authentifie';
  });
  readonly activeAiTokenCount = computed(() => this.aiTokens().filter((token) => token.status === 'active').length);
  readonly revokedAiTokenCount = computed(() => this.aiTokens().filter((token) => token.status !== 'active').length);
  readonly expiringAiTokenCount = computed(() => {
    const now = Date.now();
    const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;

    return this.aiTokens().filter((token) => {
      if (!token.expiresAt || token.status !== 'active') {
        return false;
      }

      const expiresAt = new Date(token.expiresAt).getTime();
      return Number.isFinite(expiresAt) && expiresAt >= now && expiresAt <= thirtyDaysFromNow;
    }).length;
  });

  ngOnInit(): void {
    void this.loadAiTokens();
  }

  getTokenStatusLabel(token: AiToken): string {
    switch (token.status) {
      case 'active':
        return 'Active';
      case 'revoked':
        return 'Revoquee';
      case 'expired':
        return 'Expiree';
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
