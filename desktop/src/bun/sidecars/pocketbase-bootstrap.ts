import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import type { DesktopPaths } from './paths';

export interface PocketBaseRuntimeSecrets {
  superuserEmail: string;
  superuserPassword: string;
  serviceUserEmail: string;
  serviceUserPassword: string;
}

export interface PocketBaseServiceUserCredentials {
  email: string;
  password: string;
}

export function loadOrCreatePocketBaseSecrets(paths: DesktopPaths): PocketBaseRuntimeSecrets {
  if (existsSync(paths.runtimeConfigFile)) {
    return JSON.parse(readFileSync(paths.runtimeConfigFile, 'utf8')) as PocketBaseRuntimeSecrets;
  }

  const secrets: PocketBaseRuntimeSecrets = {
    superuserEmail: 'local-superuser@resumate.local',
    superuserPassword: randomSecret(),
    serviceUserEmail: 'local-mcp-service@resumate.local',
    serviceUserPassword: randomSecret(),
  };

  writeFileSync(paths.runtimeConfigFile, `${JSON.stringify(secrets, null, 2)}\n`, { mode: 0o600 });
  return secrets;
}

export function upsertLocalSuperuser(paths: DesktopPaths, secrets: PocketBaseRuntimeSecrets): void {
  const result = spawnSync(
    paths.pocketbaseBinary,
    ['superuser', 'upsert', secrets.superuserEmail, secrets.superuserPassword, '--dir', paths.pbDataDir],
    { encoding: 'utf8' },
  );

  if (result.status !== 0) {
    throw new Error(`PocketBase superuser bootstrap failed: ${result.stderr || result.stdout}`);
  }
}

export async function ensureMcpServiceUser(baseUrl: string, secrets: PocketBaseRuntimeSecrets): Promise<PocketBaseServiceUserCredentials> {
  const token = await authenticateSuperuser(baseUrl, secrets);
  const existingId = await findServiceUserId(baseUrl, token, secrets.serviceUserEmail);
  const body = {
    email: secrets.serviceUserEmail,
    password: secrets.serviceUserPassword,
    passwordConfirm: secrets.serviceUserPassword,
    verified: true,
    emailVisibility: false,
    firstName: 'MCP',
    lastName: 'Service',
    name: 'MCP Service',
    isMcpServiceAccount: true,
  };

  if (existingId) {
    await pocketBaseRequest(`${baseUrl}/api/collections/users/records/${existingId}`, {
      method: 'PATCH',
      token,
      body,
    });
  } else {
    await pocketBaseRequest(`${baseUrl}/api/collections/users/records`, {
      method: 'POST',
      token,
      body,
    });
  }

  return {
    email: secrets.serviceUserEmail,
    password: secrets.serviceUserPassword,
  };
}

async function authenticateSuperuser(baseUrl: string, secrets: PocketBaseRuntimeSecrets): Promise<string> {
  const payload = {
    identity: secrets.superuserEmail,
    password: secrets.superuserPassword,
  };

  const endpoints = [
    `${baseUrl}/api/collections/_superusers/auth-with-password`,
    `${baseUrl}/api/admins/auth-with-password`,
  ];

  for (const endpoint of endpoints) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = (await response.json()) as { token?: string };
      if (data.token) {
        return data.token;
      }
    }
  }

  throw new Error('PocketBase superuser authentication failed.');
}

async function findServiceUserId(baseUrl: string, token: string, email: string): Promise<string | null> {
  const url = new URL(`${baseUrl}/api/collections/users/records`);
  url.searchParams.set('filter', `email="${email}"`);
  url.searchParams.set('perPage', '1');

  const data = await pocketBaseRequest(url.toString(), { method: 'GET', token }) as { items?: Array<{ id: string }> };
  return data.items?.[0]?.id ?? null;
}

async function pocketBaseRequest(url: string, options: { method: string; token: string; body?: unknown }): Promise<unknown> {
  const response = await fetch(url, {
    method: options.method,
    headers: {
      Authorization: `Bearer ${options.token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`PocketBase request failed ${options.method} ${url}: HTTP ${response.status} ${await response.text()}`);
  }

  return await response.json().catch(() => ({}));
}

function randomSecret(): string {
  return randomBytes(24).toString('base64url');
}
