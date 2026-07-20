import { describe, expect, test } from 'bun:test';
import { renderConfigScript, type ResumateDesktopConfig } from './config';

describe('renderConfigScript', () => {
  test('embeds desktop config as parseable JSON', () => {
    const config: ResumateDesktopConfig = {
      appMode: 'desktop',
      pocketbaseUrl: 'http://127.0.0.1:8090',
      pocketbaseAdminUrl: 'http://127.0.0.1:8090/_/',
      desktopApiToken: 'desktop-api-token',
      mcpUrl: 'http://127.0.0.1:8081/mcp',
      mcpHealthUrl: 'http://127.0.0.1:8081/actuator/health',
    };

    const script = renderConfigScript(config);
    const json = script.match(/window\.__RESUMATE_DESKTOP_CONFIG__ = (.*);<\/script>/)?.[1];

    expect(json).toBeTruthy();
    expect(JSON.parse(json ?? '{}')).toEqual(config);
  });

  test('escapes values through JSON serialization', () => {
    const script = renderConfigScript({
      appMode: 'desktop',
      pocketbaseUrl: 'http://localhost:8090',
      pocketbaseAdminUrl: 'http://localhost:8090/_/',
      desktopApiToken: 'value with "quotes"',
      mcpUrl: 'http://localhost:8081/mcp',
      mcpHealthUrl: 'http://localhost:8081/health',
    });

    expect(script).toContain('value with \\"quotes\\"');
  });

  test('does not expose PocketBase superuser credentials', () => {
    const script = renderConfigScript({
      appMode: 'desktop',
      pocketbaseUrl: 'http://localhost:8090',
      pocketbaseAdminUrl: 'http://localhost:8090/_/',
      desktopApiToken: 'desktop-api-token',
      mcpUrl: 'http://localhost:8081/mcp',
      mcpHealthUrl: 'http://localhost:8081/health',
    });

    expect(script).not.toContain('pocketbaseSuperuserEmail');
    expect(script).not.toContain('pocketbaseSuperuserPassword');
  });
});
