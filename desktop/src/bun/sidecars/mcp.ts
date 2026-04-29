import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { DesktopPaths } from './paths';
import { requireExecutable } from './paths';
import type { ManagedProcess } from './process';
import { startManagedProcess } from './process';
import { waitForTcp } from './ports';
import type { PocketBaseServiceUserCredentials } from './pocketbase-bootstrap';

export interface McpSidecar {
  url: string;
  process: ManagedProcess;
}

export async function startMcp(
  paths: DesktopPaths,
  port: number,
  pocketbaseUrl: string,
  serviceUser: PocketBaseServiceUserCredentials,
): Promise<McpSidecar> {
  requireExecutable(paths.javaBinary, 'Java runtime');
  if (!existsSync(paths.mcpJar)) {
    throw new Error(`MCP jar is missing at ${paths.mcpJar}. Run desktop prepare:mcp first.`);
  }

  const url = `http://127.0.0.1:${port}`;
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

  await waitForTcp(port, 30_000);

  return { url: `${url}/mcp`, process: managedProcess };
}
