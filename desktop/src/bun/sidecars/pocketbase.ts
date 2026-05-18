import { join } from 'node:path';
import type { DesktopPaths } from './paths';
import { requireExecutable } from './paths';
import type { ManagedProcess } from './process';
import { startManagedProcess } from './process';
import { waitForHttp } from './ports';
import { ensureMcpServiceUser, loadOrCreatePocketBaseSecrets, migratePocketBaseSchema, upsertLocalSuperuser, type PocketBaseServiceUserCredentials } from './pocketbase-bootstrap';
import type { StartupReporter } from '../startup-status';

export interface PocketBaseSidecar {
  url: string;
  process: ManagedProcess;
  serviceUser: PocketBaseServiceUserCredentials;
  superuserEmail: string;
  superuserPassword: string;
}

export async function startPocketBase(paths: DesktopPaths, port: number, startup?: StartupReporter): Promise<PocketBaseSidecar> {
  startup?.start('PB-010', paths.pocketbaseBinary);
  requireExecutable(paths.pocketbaseBinary, 'PocketBase sidecar');
  startup?.ok('PB-010');

  startup?.start('PB-020', paths.runtimeConfigFile);
  const secrets = loadOrCreatePocketBaseSecrets(paths);
  startup?.ok('PB-020');

  startup?.start('PB-030', paths.pbMigrationsDir);
  migratePocketBaseSchema(paths);
  startup?.ok('PB-030');

  startup?.start('PB-040', secrets.superuserEmail);
  upsertLocalSuperuser(paths, secrets);
  startup?.ok('PB-040');

  const url = `http://127.0.0.1:${port}`;
  startup?.start('PB-050', url);
  const managedProcess = startManagedProcess({
    name: 'pocketbase',
    command: paths.pocketbaseBinary,
    args: [
      'serve',
      '--dir',
      paths.pbDataDir,
      '--hooksDir',
      paths.pbHooksDir,
      '--migrationsDir',
      paths.pbMigrationsDir,
      '--http',
      `127.0.0.1:${port}`,
    ],
    cwd: paths.resourcesRoot,
    logFile: join(paths.logsDir, 'pocketbase.log'),
  });
  startup?.ok('PB-050', 'Log: pocketbase.log');

  let serviceUser: PocketBaseServiceUserCredentials;
  try {
    startup?.start('PB-060', `${url}/api/health`);
    await waitForHttp(`${url}/api/health`);
    startup?.ok('PB-060');

    startup?.start('PB-070', secrets.serviceUserEmail);
    serviceUser = await ensureMcpServiceUser(url, secrets);
    startup?.ok('PB-070');
  } catch (error) {
    await managedProcess.stop();
    throw error;
  }

  return {
    url,
    process: managedProcess,
    serviceUser,
    superuserEmail: secrets.superuserEmail,
    superuserPassword: secrets.superuserPassword,
  };
}
