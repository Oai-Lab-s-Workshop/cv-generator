import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import Electrobun from 'electrobun';
import { renderConfigScript } from './config';
import { resolveDesktopPaths } from './sidecars/paths';
import { getFreeLocalPort } from './sidecars/ports';
import { startPocketBase } from './sidecars/pocketbase';
import { startMcp } from './sidecars/mcp';
import type { ManagedProcess } from './sidecars/process';

const sidecars: ManagedProcess[] = [];

async function main(): Promise<void> {
  const paths = resolveDesktopPaths();
  const [pocketbasePort, mcpPort] = await Promise.all([getFreeLocalPort(), getFreeLocalPort()]);

  const pocketbase = await startPocketBase(paths, pocketbasePort);
  sidecars.push(pocketbase.process);

  const mcp = await startMcp(paths, mcpPort, pocketbase.url, pocketbase.serviceUser);
  sidecars.push(mcp.process);

  const html = renderAngularHtml(paths.angularIndex, {
    appMode: 'desktop',
    pocketbaseUrl: pocketbase.url,
    mcpUrl: mcp.url,
  });

  new Electrobun.BrowserWindow({
    title: 'Resumate',
    frame: { x: 0, y: 0, width: 1280, height: 900 },
    html,
    renderer: 'cef',
    titleBarStyle: 'default',
    transparent: false,
    passthrough: false,
    navigationRules: JSON.stringify(['file://*', 'http://127.0.0.1:*', 'resumate://*']),
  });
}

function renderAngularHtml(indexPath: string, config: Parameters<typeof renderConfigScript>[0]): string {
  if (!existsSync(indexPath)) {
    throw new Error(`Angular desktop build is missing at ${indexPath}. Run bun run prepare:frontend from desktop/ first.`);
  }

  const indexDirUrl = `${pathToFileURL(indexPath).href.replace(/\/index\.html$/, '/')}`;
  const configScript = renderConfigScript(config);
  const html = readFileSync(indexPath, 'utf8');

  return html
    .replace(/<base href="[^"]*">/, `<base href="${indexDirUrl}">`)
    .replace('<head>', `<head>${configScript}`);
}

async function shutdown(): Promise<void> {
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
