import { describe, expect, test } from 'bun:test';
import { createServer } from 'node:net';
import { getFreeLocalPort, waitForTcp } from './ports';

describe('port helpers', () => {
  test('allocates a usable local port', async () => {
    const port = await getFreeLocalPort();

    expect(port).toBeGreaterThan(0);
    expect(port).toBeLessThanOrEqual(65_535);
  });

  test('waits for a TCP listener', async () => {
    const port = await getFreeLocalPort();
    const server = createServer();

    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', resolve);
    });

    try {
      await expect(waitForTcp(port, 1_000)).resolves.toBeUndefined();
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
