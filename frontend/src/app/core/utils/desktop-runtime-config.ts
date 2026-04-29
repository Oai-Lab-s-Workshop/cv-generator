import { environment } from '../../../environments/environment';

export interface DesktopRuntimeConfig {
  appMode: 'desktop';
  pocketbaseUrl: string;
  mcpUrl?: string;
}

declare global {
  interface Window {
    __RESUMATE_DESKTOP_CONFIG__?: DesktopRuntimeConfig;
  }
}

export function resolvePocketBaseUrl(): string {
  return window.__RESUMATE_DESKTOP_CONFIG__?.pocketbaseUrl ?? environment.pocketbaseUrl;
}

export function resolveMcpUrl(): string | undefined {
  return window.__RESUMATE_DESKTOP_CONFIG__?.mcpUrl;
}
