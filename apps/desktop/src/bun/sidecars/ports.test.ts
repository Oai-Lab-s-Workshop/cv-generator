import { describe, expect, test } from 'bun:test';
import { createServer } from 'node:net';
import { getFreeLocalPort, waitForHttp, waitForTcp } from './ports';

function mockFetch(status: number, body = ''): typeof fetch {
  return ((..._args: Parameters<typeof fetch>) =>
    Promise.resolve(new Response(body, { status }))) as unknown as typeof fetch;
}

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

  test('waits for a successful HTTP response', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch(200, 'ok');

    try {
      await expect(waitForHttp('http://127.0.0.1:1234', 10)).resolves.toBeUndefined();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('reports HTTP timeout details', async () => {
    const originalFetch = globalThis.fetch;
    const originalSleep = Bun.sleep;
    globalThis.fetch = mockFetch(503, 'nope');
    Bun.sleep = (() => Promise.resolve()) as typeof Bun.sleep;

    try {
      await expect(waitForHttp('http://127.0.0.1:1234', 1)).rejects.toThrow('HTTP 503');
    } finally {
      globalThis.fetch = originalFetch;
      Bun.sleep = originalSleep;
    }
  });

  test('reports TCP timeout details', async () => {
    const port = await getFreeLocalPort();
    const originalSleep = Bun.sleep;
    Bun.sleep = (() => Promise.resolve()) as typeof Bun.sleep;

    try {
      await expect(waitForTcp(port, 1)).rejects.toThrow(`Timed out waiting for TCP 127.0.0.1:${port}`);
    } finally {
      Bun.sleep = originalSleep;
    }
  });
});
