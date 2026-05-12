import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import Electrobun, { ApplicationMenu, BrowserWindow, type ApplicationMenuItemConfig } from 'electrobun';
import { renderConfigScript } from './config';
import { resolveDesktopPaths } from './sidecars/paths';
import { getFreeLocalPort } from './sidecars/ports';
import { startPocketBase } from './sidecars/pocketbase';
import { startMcp } from './sidecars/mcp';
import type { ManagedProcess } from './sidecars/process';


const sidecars: ManagedProcess[] = [];
const servers: ReturnType<typeof Bun.serve>[] = [];

async function main(): Promise<void> {
  configureApplicationMenu();

  const paths = resolveDesktopPaths();
  const [pocketbasePort, mcpPort, frontendPort] = await Promise.all([getFreeLocalPort(), getFreeLocalPort(), getFreeLocalPort()]);

  const pocketbase = await startPocketBase(paths, pocketbasePort);
  sidecars.push(pocketbase.process);

  const mcp = await startMcp(paths, mcpPort, pocketbase.url, pocketbase.serviceUser);
  sidecars.push(mcp.process);

  let win: BrowserWindow | undefined;

  const frontend = startAngularServer(paths.angularIndex, frontendPort, {
    appMode: 'desktop',
    pocketbaseUrl: pocketbase.url,
    pocketbaseAdminUrl: `${pocketbase.url}/_/`,
    pocketbaseSuperuserEmail: pocketbase.superuserEmail,
    pocketbaseSuperuserPassword: pocketbase.superuserPassword,
    mcpUrl: mcp.url,
    mcpHealthUrl: mcp.healthUrl,
  }, () => win);
  servers.push(frontend.server);

  win = new Electrobun.BrowserWindow({
    title: 'Resumate',
    frame: { x: 0, y: 0, width: 1280, height: 900 },
    url: frontend.url,
    renderer: 'cef',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    transparent: false,
    passthrough: false,
    navigationRules: JSON.stringify(['views://*', 'file://*', 'http://127.0.0.1:*', 'resumate://*']),
  });
}

function configureApplicationMenu(): void {
  const menu: ApplicationMenuItemConfig[] = [
    {
      label: 'Resumate',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'showAll' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'toggleFullScreen' },
        { type: 'separator' },
        { role: 'bringAllToFront' },
        { role: 'close' },
      ],
    },
  ];

  ApplicationMenu.setApplicationMenu(menu);
}

function renderAngularHtml(indexPath: string, config: Parameters<typeof renderConfigScript>[0]): string {
  if (!existsSync(indexPath)) {
    throw new Error(`Angular desktop build is missing at ${indexPath}. Run bun run prepare:frontend from desktop/ first.`);
  }

  const configScript = renderConfigScript(config);
  const html = readFileSync(indexPath, 'utf8');

  return html
    .replace(/<base href="[^"]*">/, '<base href="/">')
    .replace('<head>', `<head>${configScript}`);
}

function startAngularServer(
  indexPath: string,
  port: number,
  config: Parameters<typeof renderConfigScript>[0],
  getWindow?: () => BrowserWindow | undefined,
): { url: string; server: ReturnType<typeof Bun.serve> } {
  const indexHtml = renderAngularHtml(indexPath, config);
  const angularRoot = dirname(indexPath);

  const server = Bun.serve({
    hostname: '127.0.0.1',
    port,
    async fetch(request) {
      const url = new URL(request.url);
      const pathname = decodeURIComponent(url.pathname);

      // Window control API endpoints
      if (getWindow) {
        switch (pathname) {
          case '/api/window/minimize':
            getWindow()?.minimize();
            return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } });
          case '/api/window/maximize':
            getWindow()?.maximize();
            return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } });
          case '/api/window/unmaximize':
            getWindow()?.unmaximize();
            return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } });
          case '/api/window/close':
            getWindow()?.close();
            return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } });
          case '/api/window/state': {
            const win = getWindow();
            return new Response(
              JSON.stringify({
                minimized: win?.isMinimized() ?? false,
                maximized: win?.isMaximized() ?? false,
                fullscreen: win?.isFullScreen() ?? false,
              }),
              { headers: { 'content-type': 'application/json' } },
            );
          }
        }
      }

      if (pathname === '/' || !extname(pathname)) {
        return new Response(indexHtml, { headers: { 'content-type': 'text/html; charset=utf-8' } });
      }

      const filePath = resolve(angularRoot, `.${pathname}`);
      if (!filePath.startsWith(`${angularRoot}/`) || !existsSync(filePath)) {
        return new Response(indexHtml, { headers: { 'content-type': 'text/html; charset=utf-8' } });
      }

      return new Response(Bun.file(filePath), { headers: { 'content-type': contentType(filePath) } });
    },
  });

  return { url: `http://127.0.0.1:${port}/`, server };
}

function contentType(filePath: string): string {
  switch (extname(filePath)) {
    case '.css':
      return 'text/css; charset=utf-8';
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.ico':
      return 'image/x-icon';
    case '.png':
      return 'image/png';
    case '.woff2':
      return 'font/woff2';
    default:
      return 'application/octet-stream';
  }
}

async function shutdown(): Promise<void> {
  for (const server of servers.splice(0).reverse()) {
    server.stop(true);
  }
  await Promise.allSettled([...sidecars].reverse().map((sidecar) => sidecar.stop()));
}

process.on('exit', () => {
  for (const sidecar of [...sidecars].reverse()) {
    if (sidecar.process.exitCode === null && !sidecar.process.killed) {
      sidecar.process.kill('SIGTERM');
    }
  }
});

process.on('SIGINT', () => void shutdown().finally(() => process.exit(130)));
process.on('SIGTERM', () => void shutdown().finally(() => process.exit(143)));

main().catch((error) => {
  console.error(error);
  void shutdown().finally(() => process.exit(1));
});
