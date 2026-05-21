import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AiToken } from '../../core/models/ai-token.model';
import { AuthService } from '../../core/services/auth.service';
import { PocketBaseService } from '../../core/services/pocketbase.service';
import { getErrorMessage } from '../../core/utils/error-message';
import { Navbar } from '../../shared/components/navbar/navbar';

interface AgentPreset {
  id: string;
  name: string;
  description: string;
  configFormat: 'json' | 'yaml';
  configTemplate: (url: string, token: string) => string;
}

const AGENT_PRESETS: AgentPreset[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    description: 'Agent MCP d\'Anthropic pour l\'assistance au developpement.',
    configFormat: 'json',
    configTemplate: (url, token) => `{
  "mcpServers": {
    "resumate": {
      "command": "npx",
      "args": ["mcp-remote", "${url}"],
      "env": {
        "AUTHORIZATION": "Bearer ${token}"
      }
    }
  }
}`,
  },
  {
    id: 'codex',
    name: 'Codex',
    description: 'Agent MCP d\'OpenAI pour la generation et l\'analyse de code.',
    configFormat: 'json',
    configTemplate: (url, token) => `{
  "mcp": {
    "servers": [
      {
        "name": "resumate",
        "transport": "http",
        "url": "${url}",
        "headers": {
          "Authorization": "Bearer ${token}"
        }
      }
    ]
  }
}`,
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    description: 'Agent MCP open-source pour l\'automatisation et l\'assistance.',
    configFormat: 'json',
    configTemplate: (url, token) => `{
  "mcp": {
    "resumate": {
      "transport": "http",
      "url": "${url}",
      "auth": {
        "type": "bearer",
        "token": "${token}"
      }
    }
  }
}`,
  },
];

@Component({
  selector: 'app-mcp-config-page',
  imports: [FormsModule, Navbar, RouterLink],
  templateUrl: './mcp-config-page.html',
  styleUrls: ['../../styles/home-shared.css', './mcp-config-page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class McpConfigPage {
  private readonly pocketBaseService = inject(PocketBaseService);
  private readonly authService = inject(AuthService);

  readonly agentPresets = AGENT_PRESETS;
  readonly selectedAgent = signal<string>(AGENT_PRESETS[0]?.id ?? '');
  readonly customToken = signal('');
  readonly customUrl = signal(window.location.origin.replace(/:\d+$/, '') + ':8080/mcp');
  readonly copiedAgent = signal<string | null>(null);
  readonly aiTokens = signal<AiToken[]>([]);
  readonly isLoadingTokens = signal(true);
  readonly currentUser = this.authService.currentUser;
  readonly currentUserName = signal('');

  ngOnInit(): void {
    void this.loadAiTokens();
    const user = this.currentUser();
    this.currentUserName.set(user ? `${user.firstName} ${user.lastName}` : 'Utilisateur authentifie');
  }

  getSelectedPreset(): AgentPreset | undefined {
    return this.agentPresets.find((preset) => preset.id === this.selectedAgent());
  }

  getGeneratedConfig(): string {
    const preset = this.getSelectedPreset();
    if (!preset) {
      return '';
    }

    const token = this.customToken() || 'votre-token-ici';
    const url = this.customUrl();
    return preset.configTemplate(url, token);
  }

  async copyConfig(presetId: string): Promise<void> {
    const config = this.getGeneratedConfig();
    if (!config) {
      return;
    }

    try {
      await navigator.clipboard.writeText(config);
      this.copiedAgent.set(presetId);
      setTimeout(() => this.copiedAgent.set(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = config;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.copiedAgent.set(presetId);
      setTimeout(() => this.copiedAgent.set(null), 2000);
    }
  }

  isCopied(presetId: string): boolean {
    return this.copiedAgent() === presetId;
  }

  private async loadAiTokens(): Promise<void> {
    this.isLoadingTokens.set(true);
    try {
      this.aiTokens.set(await this.pocketBaseService.getCurrentUserAiTokens());
    } catch {
      this.aiTokens.set([]);
    } finally {
      this.isLoadingTokens.set(false);
    }
  }
}
