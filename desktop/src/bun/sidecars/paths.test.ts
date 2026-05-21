import { afterEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { requireExecutable, resolveDesktopPaths, toFileUrl } from './paths';

const originalHome = process.env.HOME;
const tempRoots: string[] = [];

afterEach(() => {
  process.env.HOME = originalHome;
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe('desktop path helpers', () => {
  test('converts a path to a file URL', () => {
    expect(toFileUrl('/tmp/resumate/index.html')).toBe('file:///tmp/resumate/index.html');
  });

  test('throws when an executable is missing', () => {
    const missingPath = join(import.meta.dir, 'missing-executable');

    expect(() => requireExecutable(missingPath, 'PocketBase')).toThrow(
      `PocketBase is missing at ${missingPath}. Run desktop resource preparation for this platform first.`,
    );
  });

  test('accepts an executable path that exists', () => {
    const root = join(tmpdir(), `resumate-paths-${Date.now()}`);
    tempRoots.push(root);
    mkdirSync(root, { recursive: true });
    const executable = join(root, 'tool');
    writeFileSync(executable, '');

    expect(() => requireExecutable(executable, 'Tool')).not.toThrow();
  });

  test('resolves development desktop paths and creates writable data directories', () => {
    const home = join(tmpdir(), `resumate-home-${Date.now()}`);
    tempRoots.push(home);
    process.env.HOME = home;

    const paths = resolveDesktopPaths();

    expect(paths.appRoot).toContain('/desktop');
    expect(paths.resourcesRoot).toContain('dist/resources');
    expect(paths.angularIndex).toContain('dist/angular/browser/index.html');
    expect(paths.pocketbaseBinary).toContain(`pocketbase/${process.platform}-${process.arch}`);
    expect(paths.javaBinary).toContain(`java-runtime/${process.platform}-${process.arch}/bin`);
    expect(paths.mcpJar).toContain('resumate-mcp.jar');
    expect(existsSync(paths.pbDataDir)).toBe(true);
    expect(existsSync(paths.logsDir)).toBe(true);
  });
});
