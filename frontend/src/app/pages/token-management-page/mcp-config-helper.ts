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

interface CustomClientField {
  key: string;
  value: string;
  copyable: boolean;
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
    id: 'custom-client',
    name: 'Client personnalisé',
    description: 'Affichage structuré des valeurs essentielles pour un client MCP personnalisé.',
    configFormat: 'flat',
    configTemplate: (url, token) =>
      `URL du serveur MCP : ${url}\n` +
      `Transport          : HTTP (Streamable)\n` +
      `Méthode auth       : Clé API\n` +
      `Header Auth        : Authorization: Bearer ${token || '<votre-cle-api>'}\n` +
      `Clé API            : ${token || '<votre-cle-api>'}\n` +
      `Outils disponibles : list_resumes, generate_cv, get_token_status, create_token, revoke_token, list_tokens`,
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
  readonly copiedField = signal<string | null>(null);

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

  customClientConfig(): CustomClientField[] {
    const token = this.customToken() || '<votre-cle-api>';
    const authHeader = token !== '<votre-cle-api>' ? `Authorization: Bearer ${token}` : 'Authorization: Bearer <votre-cle-api>';
    return [
      { key: 'URL du serveur MCP', value: this.customUrl(), copyable: true },
      { key: 'Transport', value: 'HTTP (Streamable)', copyable: false },
      { key: 'Méthode d\'authentification', value: 'Clé API', copyable: false },
      { key: 'Header d\'autorisation', value: authHeader, copyable: true },
      { key: 'Clé API', value: token, copyable: true },
      { key: 'Outils disponibles', value: 'list_resumes, generate_cv, get_token_status, create_token, revoke_token, list_tokens', copyable: false },
    ];
  }

  async copyFieldValue(value: string, fieldKey: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    this.copiedField.set(fieldKey);
    setTimeout(() => this.copiedField.set(null), 2000);
  }

  async copyAllFields(): Promise<void> {
    const fields = this.customClientConfig();
    const text = fields.map((f) => `${f.key} : ${f.value}`).join('\n');

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    this.copiedAgent.set(this.selectedAgent());
    setTimeout(() => this.copiedAgent.set(null), 2000);
  }

  isFieldCopied(fieldKey: string): boolean {
    return this.copiedField() === fieldKey;
  }
}
