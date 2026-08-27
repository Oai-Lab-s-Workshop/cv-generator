import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiToken } from '../../core/models/ai-token.model';
import { AuthService } from '../../core/services/auth.service';
import { PocketBaseService } from '../../core/services/pocketbase.service';
import { getErrorMessage } from '../../core/utils/error-message';
import { environment } from '../../../environments/environment';
import {
  loadRuntimeConfig,
  resolveMcpEndpointUrl,
  resolveMcpUrl,
  resolveOAuthDiscoveryUrl,
} from '../../core/utils/desktop-runtime-config';
import { Navbar } from '../../shared/components/navbar/navbar';
import { McpConfigHelper } from './mcp-config-helper';

@Component({
  selector: 'app-token-management-page',
  imports: [DatePipe, FormsModule, Navbar, McpConfigHelper],
  templateUrl: './token-management-page.html',
  styleUrls: ['./token-management-page.css'],
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
  readonly errorMessage = signal<string | null>(null);
  readonly activeAiTokenMutationId = signal<string | null>(null);
  readonly selectedAuthMethod = signal<'oauth' | 'api-key'>('oauth');
  readonly oauthMcpEndpointUrl = signal(resolveMcpEndpointUrl());
  readonly oauthDiscoveryUrl = signal(resolveOAuthDiscoveryUrl());
  readonly mcpEndpointUrl = signal(resolveMcpEndpointUrl());
  readonly mcpSourceLabel = signal(this.computeMcpSourceLabel());
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
    void this.loadMcpRuntimeUrls();
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

  selectAuthMethod(method: 'oauth' | 'api-key'): void {
    this.selectedAuthMethod.set(method);
  }

  private computeMcpSourceLabel(): string {
    if (resolveMcpUrl()) {
      return 'Configuration desktop locale';
    }
    if (window.__RESUMATE_RUNTIME_CONFIG__?.mcpPublicBaseUrl?.trim()) {
      return 'Configuration runtime hébergée';
    }
    if (environment.mcpPublicBaseUrl.trim()) {
      return "Configuration d'environnement";
    }
    return 'Fallback local PocketBase';
  }

  private async loadMcpRuntimeUrls(): Promise<void> {
    await loadRuntimeConfig();
    this.oauthMcpEndpointUrl.set(resolveMcpEndpointUrl());
    this.oauthDiscoveryUrl.set(resolveOAuthDiscoveryUrl());
    this.mcpEndpointUrl.set(resolveMcpEndpointUrl());
    this.mcpSourceLabel.set(this.computeMcpSourceLabel());
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

    try {
      const createdToken = await this.pocketBaseService.createCurrentUserAiToken({
        label,
        expiresAt: this.newAiTokenExpiresAt() ? new Date(this.newAiTokenExpiresAt()).toISOString() : null,
      });

      this.latestCreatedAiToken.set(createdToken.rawToken);
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
