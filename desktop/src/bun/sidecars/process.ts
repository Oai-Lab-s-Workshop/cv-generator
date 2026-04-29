import { createWriteStream } from 'node:fs';
import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';

export interface ManagedProcess {
  name: string;
  process: ChildProcess;
  stop: () => Promise<void>;
}

export function startManagedProcess(options: {
  name: string;
  command: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string | undefined>;
  logFile: string;
}): ManagedProcess {
  const log = createWriteStream(options.logFile, { flags: 'a' });
  const child = spawn(options.command, options.args, {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout?.pipe(log, { end: false });
  child.stderr?.pipe(log, { end: false });
  child.once('exit', (code, signal) => {
    log.write(`\n[${new Date().toISOString()}] ${options.name} exited code=${code ?? 'null'} signal=${signal ?? 'null'}\n`);
  });

  return {
    name: options.name,
    process: child,
    stop: () => stopChild(child, log),
  };
}

async function stopChild(child: ChildProcess, log: ReturnType<typeof createWriteStream>): Promise<void> {
  if (child.exitCode !== null || child.killed) {
    log.end();
    return;
  }

  child.kill('SIGTERM');

  await Promise.race([
    new Promise<void>((resolve) => child.once('exit', () => resolve())),
    Bun.sleep(5_000).then(() => {
      if (child.exitCode === null && !child.killed) {
        child.kill('SIGKILL');
      }
    }),
  ]);

  log.end();
}
