import { createWriteStream, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { once } from 'node:events';

const root = resolve(import.meta.dir, '../..');
const desktopRoot = resolve(root, 'desktop');
const version = process.env.POCKETBASE_VERSION || '0.31.0';
const target = resolve(desktopRoot, 'resources/pocketbase', `${process.platform}-${process.arch}`);
const archive = resolve(target, 'pocketbase.zip');
const assetName = pocketBaseAssetName(version);
const url = `https://github.com/pocketbase/pocketbase/releases/download/v${version}/${assetName}`;

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

console.log(`[pocketbase] Downloading ${url}`);
await download(url, archive);
run('unzip', ['-o', archive, '-d', target]);
rmSync(archive, { force: true });

const binary = resolve(target, process.platform === 'win32' ? 'pocketbase.exe' : 'pocketbase');
if (!existsSync(binary)) {
  throw new Error(`Downloaded PocketBase archive did not contain ${binary}.`);
}

if (process.platform !== 'win32') {
  run('chmod', ['755', binary]);
}

console.log(`[pocketbase] Prepared ${binary}`);

function pocketBaseAssetName(pbVersion: string): string {
  const os = platformName();
  const arch = archName();
  return `pocketbase_${pbVersion}_${os}_${arch}.zip`;
}

function platformName(): string {
  if (process.platform === 'darwin') {
    return 'darwin';
  }
  if (process.platform === 'linux') {
    return 'linux';
  }
  if (process.platform === 'win32') {
    return 'windows';
  }
  throw new Error(`Unsupported platform: ${process.platform}`);
}

function archName(): string {
  if (process.arch === 'arm64') {
    return 'arm64';
  }
  if (process.arch === 'x64') {
    return 'amd64';
  }
  throw new Error(`Unsupported architecture: ${process.arch}`);
}

async function download(sourceUrl: string, destination: string): Promise<void> {
  const response = await fetch(sourceUrl);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${sourceUrl}: HTTP ${response.status}`);
  }

  const file = createWriteStream(destination);
  for await (const chunk of response.body) {
    file.write(chunk);
  }
  file.end();
  await once(file, 'finish');
}

function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`${command} failed with exit code ${result.status ?? 'unknown'}.`);
  }
}
