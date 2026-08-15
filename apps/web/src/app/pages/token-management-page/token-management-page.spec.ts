import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AiToken } from '../../core/models/ai-token.model';
import { AuthService } from '../../core/services/auth.service';
import { PocketBaseService } from '../../core/services/pocketbase.service';
import { environment } from '../../../environments/environment';
import { TokenManagementPage } from './token-management-page';

const activeToken: AiToken = {
  id: 'token-1',
  token_hash: 'hash-1',
  token_prefix: 'rmcp_abcd',
  user: 'user-1',
  label: 'Assistant principal',
  status: 'active',
  created: '2026-05-01 10:00:00',
};

const expiringToken: AiToken = {
  ...activeToken,
  id: 'token-2',
  token_prefix: 'rmcp_exp',
  label: 'Expiring',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};

const revokedToken: AiToken = {
  ...activeToken,
  id: 'token-3',
  token_prefix: 'rmcp_rev',
  label: 'Revoked',
  status: 'revoked',
};

describe('TokenManagementPage', () => {
  let component: TokenManagementPage;
  let fixture: ComponentFixture<TokenManagementPage>;
  let pocketBaseService: {
    getCurrentUserAiTokens: jest.Mock<Promise<AiToken[]>>;
    createCurrentUserAiToken: jest.Mock<Promise<{ rawToken: string; record: AiToken }>>;
    revokeCurrentUserAiToken: jest.Mock<Promise<void>>;
  };
  const originalMcpPublicBaseUrl = environment.mcpPublicBaseUrl;
  const originalFetch = window.fetch;

  beforeEach(async () => {
    environment.mcpPublicBaseUrl = 'https://mcp.example.test';
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      value: jest.fn().mockRejectedValue(new Error('No runtime config in unit tests')),
    });

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
    });

    pocketBaseService = {
      getCurrentUserAiTokens: jest.fn().mockResolvedValue([activeToken, expiringToken, revokedToken]),
      createCurrentUserAiToken: jest.fn().mockResolvedValue({
        rawToken: 'resm_created',
        record: { ...activeToken, id: 'token-created', token_prefix: 'rmcp_cre' },
      }),
      revokeCurrentUserAiToken: jest.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [TokenManagementPage],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ id: 'user-1', firstName: 'Jane', lastName: 'Doe' }),
          },
        },
        { provide: PocketBaseService, useValue: pocketBaseService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TokenManagementPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    environment.mcpPublicBaseUrl = originalMcpPublicBaseUrl;
    (window as unknown as Record<string, unknown>)['__RESUMATE_RUNTIME_CONFIG__'] = undefined;
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      value: originalFetch,
    });
    jest.restoreAllMocks();
  });

  it('creates and loads AI tokens', () => {
    expect(component).toBeTruthy();
    expect(pocketBaseService.getCurrentUserAiTokens).toHaveBeenCalled();
    expect(component.aiTokens()).toHaveLength(3);
  });

  it('computes active, revoked and expiring token counts', () => {
    expect(component.activeAiTokenCount()).toBe(2);
    expect(component.revokedAiTokenCount()).toBe(1);
    expect(component.expiringAiTokenCount()).toBe(1);
  });

  it('returns labels for every token status', () => {
    expect(component.getTokenStatusLabel(activeToken)).toBe('Active');
    expect(component.getTokenStatusLabel(revokedToken)).toBe('Revoquee');
    expect(component.getTokenStatusLabel({ ...activeToken, status: 'expired' })).toBe('Expiree');
  });

  it('renders the compact MCP config helper inside the token page', () => {
    component.selectAuthMethod('api-key');
    fixture.detectChanges();
    const helper = fixture.nativeElement.querySelector('app-mcp-config-helper');

    expect(helper).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Configuration manuelle');
  });

  it('resolves the MCP endpoint URL and source label after runtime config loads', () => {
    expect(component.mcpEndpointUrl()).toBe('https://mcp.example.test/mcp');
    expect(component.mcpSourceLabel()).toBe("Configuration d'environnement");
  });

  it('passes the resolved URL and source label to the config helper', () => {
    component.selectAuthMethod('api-key');
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('https://mcp.example.test/mcp');
    expect(text).toContain("Source : Configuration d'environnement");
  });

  it('renders OAuth as the default authentication method', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Acces MCP');
    expect(text).toContain('OAuth');
    expect(text).toContain('Connexion guidee');
    expect(text).toContain('https://mcp.example.test/mcp');
    expect(text).toContain('https://mcp.example.test/.well-known/oauth-protected-resource');
    expect(text).toContain('Aucun client OAuth connecte');
    expect(text).not.toContain('Autoriser un client manuel');
  });

  it('switches to the API key authentication method', () => {
    const apiKeyTab = fixture.nativeElement.querySelector('#api-key-tab') as HTMLButtonElement;

    apiKeyTab.click();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(component.selectedAuthMethod()).toBe('api-key');
    expect(text).toContain('Autoriser un client manuel');
    expect(text).toContain('Configuration manuelle');
    expect(text).toContain('Cles API existantes');
    expect(text).not.toContain('Connexion guidee');
  });

  it('creates a token, shows the one-time secret and refreshes tokens', async () => {
    pocketBaseService.getCurrentUserAiTokens.mockClear();
    component.newAiTokenLabel.set('New assistant');

    await component.createAiToken();
    component.selectAuthMethod('api-key');
    fixture.detectChanges();

    expect(pocketBaseService.createCurrentUserAiToken).toHaveBeenCalledWith({ label: 'New assistant', expiresAt: null });
    expect(component.latestCreatedAiToken()).toBe('resm_created');
    expect(pocketBaseService.getCurrentUserAiTokens).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain('Copiez cette cle maintenant');
  });

  it('validates token label before creation', async () => {
    component.newAiTokenLabel.set('   ');

    await component.createAiToken();

    expect(component.errorMessage()).toBe('Le label de la cle API est obligatoire.');
    expect(pocketBaseService.createCurrentUserAiToken).not.toHaveBeenCalled();
  });

  it('handles token creation errors', async () => {
    pocketBaseService.createCurrentUserAiToken.mockRejectedValueOnce(new Error('Create failed'));
    component.newAiTokenLabel.set('Broken assistant');

    await component.createAiToken();

    expect(component.errorMessage()).toBe('Create failed');
    expect(component.isCreatingAiToken()).toBe(false);
  });

  it('revokes a token and reloads tokens', async () => {
    pocketBaseService.getCurrentUserAiTokens.mockClear();

    await component.revokeAiToken(activeToken);

    expect(pocketBaseService.revokeCurrentUserAiToken).toHaveBeenCalledWith(activeToken.id);
    expect(pocketBaseService.getCurrentUserAiTokens).toHaveBeenCalledTimes(1);
    expect(component.activeAiTokenMutationId()).toBeNull();
  });

  it('handles token load and revoke errors', async () => {
    pocketBaseService.getCurrentUserAiTokens.mockRejectedValueOnce(new Error('Load failed'));
    await component['loadAiTokens']();
    expect(component.errorMessage()).toBe('Load failed');
    expect(component.isLoadingAiTokens()).toBe(false);

    pocketBaseService.revokeCurrentUserAiToken.mockRejectedValueOnce(new Error('Revoke failed'));
    await component.revokeAiToken(activeToken);
    expect(component.errorMessage()).toBe('Revoke failed');
    expect(component.activeAiTokenMutationId()).toBeNull();
  });

  it('copies the latest created token only when available', async () => {
    const writeText = navigator.clipboard.writeText as jest.Mock;

    await component.copyLatestAiToken();
    expect(writeText).not.toHaveBeenCalled();

    component.latestCreatedAiToken.set('resm_latest');
    await component.copyLatestAiToken();
    expect(writeText).toHaveBeenCalledWith('resm_latest');
  });
});
