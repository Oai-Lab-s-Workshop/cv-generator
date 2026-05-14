import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import Electrobun, { ApplicationMenu, BrowserWindow, type ApplicationMenuItemConfig } from 'electrobun';
import { Utils } from 'electrobun/bun';
import { renderConfigScript } from './config';
import { resolveDesktopPaths } from './sidecars/paths';
import { getFreeLocalPort } from './sidecars/ports';
import { startPocketBase } from './sidecars/pocketbase';
import { startMcp } from './sidecars/mcp';
import type { ManagedProcess } from './sidecars/process';
import { StartupStatusStore } from './startup-status';


const sidecars: ManagedProcess[] = [];
const servers: ReturnType<typeof Bun.serve>[] = [];
const LOADING_SERVER_CLEANUP_DELAY_MS = 2_000;
const RETURN_HOME_ACTION = 'return-home';
const startupStatus = new StartupStatusStore();

async function main(): Promise<void> {
  startupStatus.start('BOOT-001');
  const paths = resolveDesktopPaths();
  startupStatus.ok('BOOT-001', paths.resourcesRoot);

  startupStatus.start('BOOT-010');
  const [loadingPort, pocketbasePort, mcpPort, frontendPort] = await Promise.all([
    getFreeLocalPort(),
    getFreeLocalPort(),
    getFreeLocalPort(),
    getFreeLocalPort(),
  ]);
  startupStatus.ok('BOOT-010', `loading=${loadingPort}, pb=${pocketbasePort}, mcp=${mcpPort}, web=${frontendPort}`);

  const loadingServer = startLoadingServer(loadingPort, startupStatus);
  servers.push(loadingServer.server);

  if (process.platform === 'darwin') {
    Utils.setDockIconVisible(false);
  }

  const win = new Electrobun.BrowserWindow({
    title: 'Resumate',
    frame: { x: 0, y: 0, width: 1280, height: 900 },
    url: loadingServer.url,
    renderer: 'cef',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    transparent: false,
    passthrough: false,
    navigationRules: JSON.stringify(['views://*', 'file://*', 'http://127.0.0.1:*', 'resumate://*']),
  });

  try {
    const pocketbase = await startPocketBase(paths, pocketbasePort, startupStatus.reporter);
    sidecars.push(pocketbase.process);

    const mcp = await startMcp(paths, mcpPort, pocketbase.url, pocketbase.serviceUser, startupStatus.reporter);
    sidecars.push(mcp.process);

    startupStatus.start('WEB-010', paths.angularIndex);
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
    startupStatus.ok('WEB-010', frontend.url);

    startupStatus.start('WEB-020');
    configureApplicationMenu(() => win, `${frontend.url}desktop`);
    startupStatus.ok('WEB-020');

    startupStatus.start('READY-001');
    startupStatus.setRedirectUrl(`${frontend.url}desktop`);
    startupStatus.ok('READY-001');
    if (process.platform === 'darwin') {
      Utils.setDockIconVisible(true);
    }
    setTimeout(() => stopServer(loadingServer.server), LOADING_SERVER_CLEANUP_DELAY_MS);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    startupStatus.failActive(detail);
    console.error(error);
  }
}

function configureApplicationMenu(getWindow: () => BrowserWindow | undefined, desktopHomeUrl: string): void {
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
        { label: 'Return to Desktop Home', action: RETURN_HOME_ACTION, accelerator: 'CmdOrCtrl+Shift+H' },
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
  ApplicationMenu.on('application-menu-clicked', (event: unknown) => {
    const action = (event as { data?: { action?: string } }).data?.action;
    if (action !== RETURN_HOME_ACTION) {
      return;
    }

    const win = getWindow();
    win?.webview.loadURL(desktopHomeUrl);
    win?.focus();
  });
}

function startLoadingServer(port: number, statusStore: StartupStatusStore): { url: string; server: ReturnType<typeof Bun.serve> } {
  const loadingHtml = renderLoadingHtml();
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port,
    fetch(request) {
      const url = new URL(request.url);
      if (url.pathname === '/api/startup/status') {
        return new Response(JSON.stringify(statusStore.snapshot()), {
          headers: { 'content-type': 'application/json; charset=utf-8' },
        });
      }

      return new Response(loadingHtml, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    },
  });

  return { url: `http://127.0.0.1:${port}/`, server };
}

function renderLoadingHtml(): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Resumate loading</title>
  <style>
    :root { color-scheme: dark; --bg: #10111f; --panel: #17182b; --ink: #f5f7ff; --muted: #9aa3bd; --ok: #62d394; --run: #78a8ff; --fail: #ff6b7c; --pending: #4a5068; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: radial-gradient(circle at top left, #2d1b69 0, transparent 34rem), var(--bg); color: var(--ink); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    main { width: min(920px, calc(100vw - 40px)); padding: 36px; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 28px; background: rgba(23, 24, 43, 0.86); box-shadow: 0 24px 80px rgba(0, 0, 0, 0.38); }
    h1 { margin: 0 0 10px; font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: clamp(34px, 6vw, 64px); letter-spacing: -0.06em; }
    .subtitle { margin: 0 0 28px; color: var(--muted); font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 16px; }
    .summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 22px; }
    .card { padding: 14px 16px; border-radius: 16px; background: rgba(255, 255, 255, 0.06); }
    .label { display: block; color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; }
    .value { display: block; margin-top: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 9px; }
    li { display: grid; grid-template-columns: 94px 88px 1fr; gap: 14px; align-items: start; padding: 13px 14px; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; background: rgba(255, 255, 255, 0.035); }
    code { color: #d8ddff; font-weight: 700; }
    .status { width: max-content; padding: 3px 9px; border-radius: 999px; background: var(--pending); color: white; font-size: 12px; }
    .status.running { background: var(--run); color: #081326; }
    .status.ok { background: var(--ok); color: #06190d; }
    .status.failed { background: var(--fail); color: #2c0308; }
    .message { display: grid; gap: 4px; }
    .detail { color: var(--muted); font-size: 12px; overflow-wrap: anywhere; }
    .footer { margin-top: 20px; color: var(--muted); font-size: 12px; }
    @media (max-width: 720px) { main { padding: 24px; } .summary { grid-template-columns: 1fr; } li { grid-template-columns: 1fr; gap: 8px; } }
  </style>
</head>
<body>
  <main>
    <h1>Booting Resumate</h1>
    <p class="subtitle">Keep this screen open if startup crashes. The last red or blue code points to the failing loading step.</p>
    <section class="summary">
      <div class="card"><span class="label">Current</span><span id="active" class="value">BOOT-001</span></div>
      <div class="card"><span class="label">Failed</span><span id="failed" class="value">None</span></div>
      <div class="card"><span class="label">Hint</span><span class="value">See pocketbase.log / mcp.log</span></div>
    </section>
    <ol id="steps"></ol>
    <p class="footer">Codes are intentionally stable and short so they can be mapped in a translation table.</p>
  </main>
  <script>
    const stepsNode = document.getElementById('steps');
    const activeNode = document.getElementById('active');
    const failedNode = document.getElementById('failed');
    let redirected = false;

    function render(snapshot) {
      activeNode.textContent = snapshot.activeCode || 'READY';
      failedNode.textContent = snapshot.failedCode || 'None';
      stepsNode.replaceChildren(...snapshot.steps.map(function(step) {
        const item = document.createElement('li');
        const code = document.createElement('code');
        const status = document.createElement('span');
        const message = document.createElement('span');
        const title = document.createElement('span');
        code.textContent = step.code;
        status.className = 'status ' + step.status;
        status.textContent = step.status.toUpperCase();
        message.className = 'message';
        title.textContent = step.message;
        message.append(title);
        if (step.detail) {
          const detail = document.createElement('span');
          detail.className = 'detail';
          detail.textContent = step.detail;
          message.append(detail);
        }
        item.append(code, status, message);
        return item;
      }));

      if (snapshot.redirectUrl && !snapshot.failedCode && !redirected) {
        redirected = true;
        window.setTimeout(function() { window.location.assign(snapshot.redirectUrl); }, 350);
      }
    }

    async function poll() {
      try {
        const response = await fetch('/api/startup/status', { cache: 'no-store' });
        render(await response.json());
      } catch (error) {
        failedNode.textContent = 'STATUS-POLL';
      } finally {
        window.setTimeout(poll, 350);
      }
    }

    poll();
  </script>
</body>
</html>`;
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

function stopServer(server: ReturnType<typeof Bun.serve>): void {
  const index = servers.indexOf(server);
  if (index === -1) {
    return;
  }

  servers.splice(index, 1);
  server.stop(true);
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
