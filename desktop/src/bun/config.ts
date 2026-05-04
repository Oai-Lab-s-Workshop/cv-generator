export interface ResumateDesktopConfig {
  appMode: 'desktop';
  pocketbaseUrl: string;
  pocketbaseAdminUrl: string;
  pocketbaseSuperuserEmail: string;
  pocketbaseSuperuserPassword: string;
  mcpUrl: string;
  mcpHealthUrl: string;
}

export function renderConfigScript(config: ResumateDesktopConfig): string {
  return `<script>window.__RESUMATE_DESKTOP_CONFIG__ = ${JSON.stringify(config)};</script>`;
}
