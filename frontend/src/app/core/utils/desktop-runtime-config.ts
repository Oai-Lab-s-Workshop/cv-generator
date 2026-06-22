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
const RUNTIME_CONFIG_CACHE_KEY = 'resumate:runtime-config';
const RUNTIME_CONFIG_CACHE_TTL_MS = 300_000; // 5 minutes

interface CachedRuntimeConfig {
  data: RuntimeConfig;
  timestamp: number;
}

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

function getSessionStorage(): Storage | null {
  try {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage;
    }
  } catch {
    // sessionStorage may throw in privacy modes or restricted environments
  }
  return null;
}

export async function loadRuntimeConfig(): Promise<void> {
  if (typeof fetch !== 'function') {
    return;
  }

  const storage = getSessionStorage();

  // Check sessionStorage cache first
  if (storage) {
    try {
      const cached = storage.getItem(RUNTIME_CONFIG_CACHE_KEY);
      if (cached) {
        const parsed: CachedRuntimeConfig = JSON.parse(cached);
        if (parsed.data && parsed.timestamp && Date.now() - parsed.timestamp < RUNTIME_CONFIG_CACHE_TTL_MS) {
          window.__RESUMATE_RUNTIME_CONFIG__ = parsed.data;
          return;
        }
      }
    } catch {
      // Corrupted cache or read error; fall through to fetch
    }
  }

  try {
    const response = await fetch('/assets/runtime-config.json', { cache: 'no-store' });
    if (!response.ok) {
      return;
    }

    const config = (await response.json()) as Record<string, unknown>;
    const runtimeConfig: RuntimeConfig = {
      mcpPublicBaseUrl: typeof config['mcpPublicBaseUrl'] === 'string' ? config['mcpPublicBaseUrl'].trim() : undefined,
    };
    window.__RESUMATE_RUNTIME_CONFIG__ = runtimeConfig;

    // Cache the fetched config in sessionStorage
    if (storage) {
      try {
        storage.setItem(
          RUNTIME_CONFIG_CACHE_KEY,
          JSON.stringify({ data: runtimeConfig, timestamp: Date.now() }),
        );
      } catch {
        // Storage full or write error; config remains set on window
      }
    }
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
