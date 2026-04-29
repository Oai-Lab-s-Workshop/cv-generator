import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const root = resolve(import.meta.dir, '../..');
const desktopRoot = resolve(root, 'desktop');
const distRoot = resolve(desktopRoot, 'dist');
const resourcesRoot = resolve(distRoot, 'resources');

rmSync(distRoot, { recursive: true, force: true });
mkdirSync(resourcesRoot, { recursive: true });

copyAngularBuild();
copyPocketBaseRuntimeFiles();
copyMcpJar();
copyOptionalSidecars();

function copyAngularBuild(): void {
  const source = resolve(desktopRoot, '.cache/angular');
  const target = resolve(distRoot, 'angular');
  requirePath(source, 'Angular desktop build');
  cpSync(source, target, { recursive: true });
}

function copyPocketBaseRuntimeFiles(): void {
  cpSync(resolve(root, 'pb_migrations'), resolve(resourcesRoot, 'pb_migrations'), { recursive: true });
  cpSync(resolve(root, 'pb_hooks'), resolve(resourcesRoot, 'pb_hooks'), { recursive: true });
}

function copyMcpJar(): void {
  const targetDir = resolve(resourcesRoot, 'mcp');
  mkdirSync(targetDir, { recursive: true });
  const jar = firstExistingFile(resolve(root, 'mcp/target'), (name) => name.endsWith('.jar') && !name.endsWith('-plain.jar'));
  if (!jar) {
    warnOrThrow('MCP jar is missing. Run `bun run prepare:mcp` from desktop/.');
    return;
  }
  copyFileSync(jar, resolve(targetDir, 'resumate-mcp.jar'));
}

function copyOptionalSidecars(): void {
  copyIfExists(resolve(desktopRoot, 'resources/pocketbase'), resolve(resourcesRoot, 'pocketbase'));
  copyIfExists(resolve(desktopRoot, 'resources/java-runtime'), resolve(resourcesRoot, 'java-runtime'));
}

function copyIfExists(source: string, target: string): void {
  if (existsSync(source)) {
    cpSync(source, target, { recursive: true });
    return;
  }
  warnOrThrow(`Optional sidecar resource folder is missing: ${source}`);
}

function requirePath(path: string, label: string): void {
  if (!existsSync(path)) {
    throw new Error(`${label} is missing at ${path}.`);
  }
}

function firstExistingFile(dir: string, predicate: (name: string) => boolean): string | null {
  if (!existsSync(dir)) {
    return null;
  }

  const match = readdirSync(dir).find(predicate);
  return match ? resolve(dir, match) : null;
}

function warnOrThrow(message: string): void {
  if (process.env.RESUMATE_ALLOW_MISSING_SIDECARS === '1') {
    console.warn(`[desktop prepare] ${message}`);
    return;
  }
  throw new Error(message);
}
