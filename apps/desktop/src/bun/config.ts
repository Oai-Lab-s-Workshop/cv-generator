export interface ResumateDesktopConfig {
  appMode: 'desktop';
  pocketbaseUrl: string;
  pocketbaseAdminUrl: string;
  desktopApiToken: string;
  mcpUrl: string;
  mcpHealthUrl: string;
  materialMcpUrl?: string;
  materialMcpHealthUrl?: string;
}

export function renderConfigScript(config: ResumateDesktopConfig): string {
  return `<script>window.__RESUMATE_DESKTOP_CONFIG__ = ${JSON.stringify(config)};</script>`;
}
