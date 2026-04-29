import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dir, '../..');
const desktopRoot = resolve(root, 'desktop');
const platformArch = `${process.platform}-${process.arch}`;
const output = resolve(desktopRoot, 'resources/java-runtime', platformArch);
const jar = firstExistingFile(resolve(root, 'mcp/target'), (name) => name.endsWith('.jar') && !name.endsWith('-plain.jar'));

if (!jar) {
  throw new Error('MCP jar is missing. Run `npm run prepare:mcp` from desktop/ first.');
}

const jdeps = javaTool('jdeps');
const jlink = javaTool('jlink');
const modules = resolveModules(jdeps, jar);

rmSync(output, { recursive: true, force: true });
mkdirSync(dirname(output), { recursive: true });

run(jlink, [
  '--add-modules',
  modules.join(','),
  '--strip-debug',
  '--no-header-files',
  '--no-man-pages',
  '--compress=2',
  '--output',
  output,
]);

console.log(`[java-runtime] Created ${output}`);

function resolveModules(jdepsPath: string, jarPath: string): string[] {
  const baseline = new Set([
    'java.base',
    'java.compiler',
    'java.desktop',
    'java.instrument',
    'java.logging',
    'java.management',
    'java.naming',
    'java.net.http',
    'java.security.jgss',
    'java.sql',
    'jdk.crypto.ec',
    'jdk.unsupported',
  ]);

  const result = spawnSync(jdepsPath, ['--ignore-missing-deps', '--multi-release', '17', '--print-module-deps', jarPath], {
    encoding: 'utf8',
  });

  if (result.status === 0 && result.stdout.trim()) {
    for (const moduleName of result.stdout.trim().split(',')) {
      baseline.add(moduleName.trim());
    }
  } else {
    console.warn('[java-runtime] jdeps could not fully resolve modules; using Spring Boot baseline modules.');
    if (result.stderr.trim()) {
      console.warn(result.stderr.trim());
    }
  }

  return [...baseline].sort();
}

function javaTool(name: 'jdeps' | 'jlink'): string {
  const executable = process.platform === 'win32' ? `${name}.exe` : name;
  if (process.env.JAVA_HOME) {
    const fromJavaHome = resolve(process.env.JAVA_HOME, 'bin', executable);
    if (existsSync(fromJavaHome)) {
      return fromJavaHome;
    }
  }

  const probe = spawnSync(executable, ['--version'], { encoding: 'utf8' });
  if (probe.status === 0) {
    return executable;
  }

  throw new Error(`${name} was not found. Install a Java 17+ JDK and set JAVA_HOME.`);
}

function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`${command} failed with exit code ${result.status ?? 'unknown'}.`);
  }
}

function firstExistingFile(dir: string, predicate: (name: string) => boolean): string | null {
  if (!existsSync(dir)) {
    return null;
  }

  const match = readdirSync(dir).find(predicate);
  return match ? resolve(dir, match) : null;
}
