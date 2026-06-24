import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { resolveMcpEndpointUrl } from '../../core/utils/desktop-runtime-config';

interface AgentPreset {
  id: string;
  name: string;
  description: string;
  configFormat: 'json' | 'yaml' | 'flat';
  configTemplate: (url: string, token: string) => string;
}

const AGENT_PRESETS: AgentPreset[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    description: 'Config locale par cle API pour Claude Code via mcp-remote.',
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
    description: 'Serveur HTTP Stream avec cle API dans le header Authorization.',
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
    description: 'Configuration par cle API pour OpenCode (header API_KEY).',
    configFormat: 'json',
    configTemplate: (url, token) => `{
  "mcp": {
    "resumate": {
      "type": "remote",
      "url": "${url}",
      "oauth": false,
      "enabled": true,
      "headers": {
        "API_KEY": "${token}"
      }
    }
  }
}`,
  },
  {
    id: 'claude-desktop',
    name: 'Claude Desktop',
    description: 'Config par cle API pour Claude Desktop App (format mcp-remote).',
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
    description: 'Liste plate des valeurs essentielles pour une configuration par cle API.',
    configFormat: 'flat',
    configTemplate: (url, token) =>
      `URL du serveur MCP : ${url}\n` +
      `Transport          : HTTP (Streamable)\n` +
      `Nom du serveur     : resumate-mcp\n` +
      `Methode auth       : Cle API manuelle\n` +
      `Header Auth        : Authorization: Bearer ${token || '<votre-cle-api>'}\n` +
      `Cle API            : ${token || '<votre-cle-api>'}`,
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
  readonly customUrl = signal(resolveMcpEndpointUrl());
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
}
