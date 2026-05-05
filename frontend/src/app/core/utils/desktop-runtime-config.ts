import { environment } from '../../../environments/environment';

export interface DesktopRuntimeConfig {
  appMode: 'desktop';
  pocketbaseUrl: string;
  pocketbaseAdminUrl?: string;
  pocketbaseSuperuserEmail?: string;
  pocketbaseSuperuserPassword?: string;
  mcpUrl?: string;
  mcpHealthUrl?: string;
}

declare global {
  interface Window {
    __RESUMATE_DESKTOP_CONFIG__?: DesktopRuntimeConfig;
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
