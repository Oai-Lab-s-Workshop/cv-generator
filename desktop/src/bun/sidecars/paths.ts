import { join, resolve } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

export interface DesktopPaths {
  appRoot: string;
  resourcesRoot: string;
  angularIndex: string;
  userDataRoot: string;
  pbDataDir: string;
  logsDir: string;
  runtimeConfigFile: string;
  pocketbaseBinary: string;
  javaBinary: string;
  mcpJar: string;
}

export function resolveDesktopPaths(): DesktopPaths {
  const isBundled = !import.meta.dir.includes('/desktop/src/bun');
  const appRoot = isBundled
    ? resolve(import.meta.dir, '..')
    : resolve(import.meta.dir, '../..');
  const resourcesRoot = isBundled
    ? resolve(appRoot, 'resources')
    : resolve(appRoot, 'dist/resources');
  const userDataRoot = resolveUserDataRoot();
  const platformArch = `${process.platform}-${process.arch}`;
  const pocketbaseName = process.platform === 'win32' ? 'pocketbase.exe' : 'pocketbase';
  const javaName = process.platform === 'win32' ? 'java.exe' : 'java';

  const paths: DesktopPaths = {
    appRoot,
    resourcesRoot,
    angularIndex: isBundled
      ? resolve(appRoot, 'views/angular/browser/index.html')
      : resolve(appRoot, 'dist/angular/browser/index.html'),
    userDataRoot,
    pbDataDir: resolve(userDataRoot, 'pb_data'),
    logsDir: resolve(userDataRoot, 'logs'),
    runtimeConfigFile: resolve(userDataRoot, 'runtime.json'),
    pocketbaseBinary: resolve(resourcesRoot, 'pocketbase', platformArch, pocketbaseName),
    javaBinary: resolve(resourcesRoot, 'java-runtime', platformArch, 'bin', javaName),
    mcpJar: resolve(resourcesRoot, 'mcp', 'resumate-mcp.jar'),
  };

  mkdirSync(paths.pbDataDir, { recursive: true });
  mkdirSync(paths.logsDir, { recursive: true });

  return paths;
}

export function requireExecutable(path: string, label: string): void {
  if (!existsSync(path)) {
    throw new Error(`${label} is missing at ${path}. Run desktop resource preparation for this platform first.`);
  }
}

export function toFileUrl(path: string): string {
  return `file://${path}`;
}

function resolveUserDataRoot(): string {
  const home = process.env.HOME || process.env.USERPROFILE;
  if (!home) {
    return resolve('.resumate-data');
  }

  if (process.platform === 'darwin') {
    return join(home, 'Library', 'Application Support', 'Resumate');
  }

  if (process.platform === 'win32') {
    return join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), 'Resumate');
  }

  return join(process.env.XDG_DATA_HOME || join(home, '.local', 'share'), 'Resumate');
}
