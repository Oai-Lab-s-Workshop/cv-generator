import { environment } from '../../../environments/environment';

export interface DesktopRuntimeConfig {
  appMode: 'desktop';
  pocketbaseUrl: string;
  pocketbaseAdminUrl?: string;
  desktopApiToken?: string;
  mcpUrl?: string;
  mcpHealthUrl?: string;
}

interface RuntimeConfig {
  mcpPublicBaseUrl?: string;
}

const DEFAULT_MCP_PORT = '8081';
const MCP_ENDPOINT_PATH = '/mcp';
const OAUTH_DISCOVERY_PATH = '/.well-known/oauth-protected-resource';

declare global {
  interface Window {
    __RESUMATE_DESKTOP_CONFIG__?: DesktopRuntimeConfig;
    __RESUMATE_RUNTIME_CONFIG__?: RuntimeConfig;
  }
}

export function resolvePocketBaseUrl(): string {
  return window.__RESUMATE_DESKTOP_CONFIG__?.pocketbaseUrl ?? environment.pocketbaseUrl;
}

export function resolveDesktopRuntimeConfig(): DesktopRuntimeConfig | undefined {
  return window.__RESUMATE_DESKTOP_CONFIG__;
}

export function isDesktopMode(): boolean {
  return window.__RESUMATE_DESKTOP_CONFIG__?.appMode === 'desktop';
}

export function resolveMcpUrl(): string | undefined {
  return window.__RESUMATE_DESKTOP_CONFIG__?.mcpUrl;
}

export async function loadRuntimeConfig(): Promise<void> {
  if (typeof fetch !== 'function') {
    return;
  }

  try {
    const response = await fetch('/assets/runtime-config.json', { cache: 'no-store' });
    if (!response.ok) {
      return;
    }

    const config = (await response.json()) as Record<string, unknown>;
    window.__RESUMATE_RUNTIME_CONFIG__ = {
      mcpPublicBaseUrl: typeof config['mcpPublicBaseUrl'] === 'string' ? config['mcpPublicBaseUrl'].trim() : undefined,
    };
  } catch {
    // Runtime config is optional; static environment defaults remain valid.
  }
}

export function resolveMcpPublicBaseUrl(): string {
  const desktopMcpUrl = resolveMcpUrl();
  if (desktopMcpUrl) {
    return stripMcpEndpointPath(desktopMcpUrl);
  }

  const runtimeMcpPublicBaseUrl = window.__RESUMATE_RUNTIME_CONFIG__?.mcpPublicBaseUrl;
  if (runtimeMcpPublicBaseUrl?.trim()) {
    return stripMcpEndpointPath(runtimeMcpPublicBaseUrl);
  }

  if (environment.mcpPublicBaseUrl.trim()) {
    return stripMcpEndpointPath(environment.mcpPublicBaseUrl);
  }

  const pbUrl = resolvePocketBaseUrl();
  try {
    const pbParsed = new URL(pbUrl, window.location.origin);
    return `${pbParsed.protocol}//${pbParsed.hostname}:${DEFAULT_MCP_PORT}`;
  } catch {
    return `${window.location.protocol}//${window.location.hostname}:${DEFAULT_MCP_PORT}`;
  }
}

export function resolveMcpEndpointUrl(): string {
  const desktopMcpUrl = resolveMcpUrl();
  if (desktopMcpUrl) {
    return withMcpEndpointPath(stripTrailingSlash(desktopMcpUrl));
  }

  return `${resolveMcpPublicBaseUrl()}${MCP_ENDPOINT_PATH}`;
}

export function resolveOAuthDiscoveryUrl(): string {
  return `${resolveMcpPublicBaseUrl()}${OAUTH_DISCOVERY_PATH}`;
}

function stripMcpEndpointPath(url: string): string {
  const trimmedUrl = stripTrailingSlash(url.trim());
  return trimmedUrl.endsWith(MCP_ENDPOINT_PATH) ? trimmedUrl.slice(0, -MCP_ENDPOINT_PATH.length) : trimmedUrl;
}

function withMcpEndpointPath(url: string): string {
  return url.endsWith(MCP_ENDPOINT_PATH) ? url : `${url}${MCP_ENDPOINT_PATH}`;
}

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
