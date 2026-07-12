import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { DesktopPaths } from './paths';
import { requireExecutable } from './paths';
import type { ManagedProcess } from './process';
import { startManagedProcess } from './process';
import { waitForTcp } from './ports';
import type { PocketBaseServiceUserCredentials } from './pocketbase-bootstrap';
import type { StartupReporter } from '../startup-status';

export interface McpSidecar {
  url: string;
  healthUrl: string;
  process: ManagedProcess;
}

export async function startMcp(
  paths: DesktopPaths,
  port: number,
  pocketbaseUrl: string,
  serviceUser: PocketBaseServiceUserCredentials,
  startup?: StartupReporter,
): Promise<McpSidecar> {
  startup?.start('MCP-010', paths.javaBinary);
  requireExecutable(paths.javaBinary, 'Java runtime');
  if (!existsSync(paths.mcpJar)) {
    throw new Error(`MCP jar is missing at ${paths.mcpJar}. Run desktop prepare:mcp first.`);
  }
  startup?.ok('MCP-010', paths.mcpJar);

  const url = `http://127.0.0.1:${port}`;
  startup?.start('MCP-020', url);
  const managedProcess = startManagedProcess({
    name: 'mcp',
    command: paths.javaBinary,
    args: [
      '-jar',
      paths.mcpJar,
      '--server.address=127.0.0.1',
      `--server.port=${port}`,
      `--resumate.pocketbase.base-url=${pocketbaseUrl}`,
      '--resumate.frontend.base-url=resumate://app',
    ],
    env: {
      POCKETBASE_SERVICE_USER_EMAIL: serviceUser.email,
      POCKETBASE_SERVICE_USER_PASSWORD: serviceUser.password,
    },
    logFile: join(paths.logsDir, 'mcp.log'),
  });
  startup?.ok('MCP-020', 'Log: mcp.log');

  try {
    startup?.start('MCP-030', `127.0.0.1:${port}`);
    await waitForTcp(port, 30_000);
    startup?.ok('MCP-030');
  } catch (error) {
    await managedProcess.stop();
    throw error;
  }

  return { url: `${url}/mcp`, healthUrl: `${url}/health`, process: managedProcess };
}
