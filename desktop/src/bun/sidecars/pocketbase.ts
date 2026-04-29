import { join } from 'node:path';
import type { DesktopPaths } from './paths';
import { requireExecutable } from './paths';
import type { ManagedProcess } from './process';
import { startManagedProcess } from './process';
import { waitForHttp } from './ports';
import { ensureMcpServiceUser, loadOrCreatePocketBaseSecrets, upsertLocalSuperuser, type PocketBaseServiceUserCredentials } from './pocketbase-bootstrap';

export interface PocketBaseSidecar {
  url: string;
  process: ManagedProcess;
  serviceUser: PocketBaseServiceUserCredentials;
}

export async function startPocketBase(paths: DesktopPaths, port: number): Promise<PocketBaseSidecar> {
  requireExecutable(paths.pocketbaseBinary, 'PocketBase sidecar');
  const secrets = loadOrCreatePocketBaseSecrets(paths);
  upsertLocalSuperuser(paths, secrets);

  const url = `http://127.0.0.1:${port}`;
  const managedProcess = startManagedProcess({
    name: 'pocketbase',
    command: paths.pocketbaseBinary,
    args: ['serve', '--dir', paths.pbDataDir, '--http', `127.0.0.1:${port}`],
    cwd: paths.resourcesRoot,
    logFile: join(paths.logsDir, 'pocketbase.log'),
  });

  await waitForHttp(`${url}/api/health`);
  const serviceUser = await ensureMcpServiceUser(url, secrets);

  return { url, process: managedProcess, serviceUser };
}
