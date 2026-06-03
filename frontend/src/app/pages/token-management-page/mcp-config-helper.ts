import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { resolveMcpUrl, resolvePocketBaseUrl } from '../../core/utils/desktop-runtime-config';

interface AgentPreset {
  id: string;
  name: string;
  description: string;
  configFormat: 'json' | 'yaml' | 'flat';
  configTemplate: (url: string, token: string) => string;
}

/** Default MCP server port used when deriving the URL from the current deployment. */
const DEFAULT_MCP_PORT = '8081';
const MCP_ENDPOINT_PATH = '/mcp';

const AGENT_PRESETS: AgentPreset[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    description: 'Config locale pour Claude Code via mcp-remote.',
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
    description: 'Serveur HTTP Stream avec header Authorization.',
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
    description: 'Configuration HTTP bearer token pour OpenCode.',
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
  {
    id: 'claude-desktop',
    name: 'Claude Desktop',
    description: 'Config pour Claude Desktop App (format mcp-remote).',
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
    id: 'plain',
    name: 'Valeurs essentielles',
    description: 'Liste plate des valeurs de configuration MCP essentielles.',
    configFormat: 'flat',
    configTemplate: (url, token) =>
      `URL du serveur MCP : ${url}\n` +
      `Transport          : HTTP (Streamable)\n` +
      `Nom du serveur     : resumate-mcp\n` +
      `Header Auth        : Authorization: Bearer ${token || '<votre-token>'}\n` +
      `API Key            : ${token || '<votre-token>'}`,
  },
];

@Component({
  selector: 'app-mcp-config-helper',
  imports: [FormsModule],
  templateUrl: './mcp-config-helper.html',
  styleUrl: './mcp-config-helper.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class McpConfigHelper {
  readonly activeTokenCount = input(0);
  readonly agentPresets = AGENT_PRESETS;
  readonly selectedAgent = signal<string>(AGENT_PRESETS[0]?.id ?? '');
  readonly customToken = signal('');
  readonly customUrl = signal(this.getDefaultMcpUrl());
  readonly copiedAgent = signal<string | null>(null);

  getSelectedPreset(): AgentPreset | undefined {
    return this.agentPresets.find((preset) => preset.id === this.selectedAgent());
  }

  getGeneratedConfig(): string {
    const preset = this.getSelectedPreset();
    if (!preset) {
      return '';
    }

    return preset.configTemplate(this.customUrl(), this.customToken() || 'votre-token-ici');
  }

  async copyConfig(): Promise<void> {
    const config = this.getGeneratedConfig();
    if (!config) {
      return;
    }

    try {
      await navigator.clipboard.writeText(config);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = config;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    this.copiedAgent.set(this.selectedAgent());
    setTimeout(() => this.copiedAgent.set(null), 2000);
  }

  isCopied(): boolean {
    return this.copiedAgent() === this.selectedAgent();
  }

  private getDefaultMcpUrl(): string {
    const desktopMcpUrl = resolveMcpUrl();
    if (desktopMcpUrl) {
      return desktopMcpUrl;
    }

    // Derive MCP address from the current deployment context.
    // The MCP server runs on the same host as the frontend / PocketBase,
    // on the MCP_PORT (default 8081) with the /mcp endpoint path.
    const pbUrl = resolvePocketBaseUrl();
    try {
      const pbParsed = new URL(pbUrl, window.location.origin);
      return `${pbParsed.protocol}//${pbParsed.hostname}:${DEFAULT_MCP_PORT}${MCP_ENDPOINT_PATH}`;
    } catch {
      return `${window.location.protocol}//${window.location.hostname}:${DEFAULT_MCP_PORT}${MCP_ENDPOINT_PATH}`;
    }
  }
}
