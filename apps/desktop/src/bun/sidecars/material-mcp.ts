import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { DesktopPaths } from './paths';
import { requireExecutable } from './paths';
import type { ManagedProcess } from './process';
import { startManagedProcess } from './process';
import { waitForTcp } from './ports';
import type { PocketBaseServiceUserCredentials } from './pocketbase-bootstrap';
import type { StartupReporter } from '../startup-status';

export interface MaterialMcpSidecar {
  url: string;
  healthUrl: string;
  process: ManagedProcess;
}

export async function startMaterialMcp(
  paths: DesktopPaths,
  port: number,
  pocketbaseUrl: string,
  serviceUser: PocketBaseServiceUserCredentials,
  startup?: StartupReporter,
): Promise<MaterialMcpSidecar> {
  startup?.start('MATERIAL-MCP-010', paths.javaBinary);
  requireExecutable(paths.javaBinary, 'Java runtime');
  if (!existsSync(paths.materialMcpJar)) {
    throw new Error(`Material MCP jar is missing at ${paths.materialMcpJar}. Run desktop prepare:mcp first.`);
  }

  const baseUrl = `http://127.0.0.1:${port}`;
  const process = startManagedProcess({
    name: 'material-mcp',
    command: paths.javaBinary,
    args: [
      '-jar', paths.materialMcpJar,
      '--server.address=127.0.0.1', `--server.port=${port}`,
      `--pocketbase.base-url=${pocketbaseUrl}`,
      '--frontend.base-url=resumate://app',
    ],
    env: {
      POCKETBASE_SERVICE_USER_EMAIL: serviceUser.email,
      POCKETBASE_SERVICE_PASSWORD: serviceUser.password,
    },
    logFile: join(paths.logsDir, 'material-mcp.log'),
  });

  try {
    await waitForTcp(port, 30_000);
  } catch (error) {
    await process.stop();
    throw error;
  }

  return { url: `${baseUrl}/mcp/materials`, healthUrl: `${baseUrl}/actuator/health`, process };
}
