import {
  isDesktopMode,
  loadRuntimeConfig,
  resolveDesktopRuntimeConfig,
  resolveMcpEndpointUrl,
  resolveMcpPublicBaseUrl,
  resolveMcpUrl,
  resolveOAuthDiscoveryUrl,
  resolvePocketBaseUrl,
} from './desktop-runtime-config';
import { environment } from '../../../environments/environment';

describe('desktop-runtime-config utilities', () => {
  const originalMcpPublicBaseUrl = environment.mcpPublicBaseUrl;
  const originalPocketbaseUrl = environment.pocketbaseUrl;
  const originalFetch = window.fetch;

  function setDesktopConfig(config: Record<string, unknown> | undefined) {
    (window as unknown as Record<string, unknown>)['__RESUMATE_DESKTOP_CONFIG__'] = config;
  }

  function setRuntimeConfig(config: Record<string, unknown> | undefined) {
    (window as unknown as Record<string, unknown>)['__RESUMATE_RUNTIME_CONFIG__'] = config;
  }

  afterEach(() => {
    (window as unknown as Record<string, unknown>)['__RESUMATE_DESKTOP_CONFIG__'] = undefined;
    (window as unknown as Record<string, unknown>)['__RESUMATE_RUNTIME_CONFIG__'] = undefined;
    environment.mcpPublicBaseUrl = originalMcpPublicBaseUrl;
    environment.pocketbaseUrl = originalPocketbaseUrl;
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      value: originalFetch,
    });
    jest.restoreAllMocks();
  });

  describe('resolvePocketBaseUrl', () => {
    it('returns the desktop pocketbase URL when desktop config is present', () => {
      setDesktopConfig({
        appMode: 'desktop',
        pocketbaseUrl: 'http://127.0.0.1:8090',
      });

      expect(resolvePocketBaseUrl()).toBe('http://127.0.0.1:8090');
    });

    it('falls back to environment.pocketbaseUrl when no desktop config', () => {
      setDesktopConfig(undefined);

      const result = resolvePocketBaseUrl();

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('resolveDesktopRuntimeConfig', () => {
    it('returns the full desktop config object', () => {
      const config = { appMode: 'desktop', pocketbaseUrl: 'http://127.0.0.1:8090' };
      setDesktopConfig(config);

      expect(resolveDesktopRuntimeConfig()).toEqual(config);
    });

    it('returns undefined when no desktop config is set', () => {
      setDesktopConfig(undefined);

      expect(resolveDesktopRuntimeConfig()).toBeUndefined();
    });
  });

  describe('isDesktopMode', () => {
    it('returns true when appMode is "desktop"', () => {
      setDesktopConfig({ appMode: 'desktop', pocketbaseUrl: 'http://127.0.0.1:8090' });

      expect(isDesktopMode()).toBe(true);
    });

    it('returns false when config is missing', () => {
      setDesktopConfig(undefined);

      expect(isDesktopMode()).toBe(false);
    });

    it('returns false when appMode is not "desktop"', () => {
      setDesktopConfig({ appMode: 'web', pocketbaseUrl: 'http://127.0.0.1:8090' });

      expect(isDesktopMode()).toBe(false);
    });
  });

  describe('resolveMcpUrl', () => {
    it('returns the MCP URL when present', () => {
      setDesktopConfig({
        appMode: 'desktop',
        pocketbaseUrl: 'http://127.0.0.1:8090',
        mcpUrl: 'http://127.0.0.1:3000',
      });

      expect(resolveMcpUrl()).toBe('http://127.0.0.1:3000');
    });

    it('returns undefined when MCP URL is missing', () => {
      setDesktopConfig({ appMode: 'desktop', pocketbaseUrl: 'http://127.0.0.1:8090' });

      expect(resolveMcpUrl()).toBeUndefined();
    });

    it('returns undefined when config is missing', () => {
      setDesktopConfig(undefined);

      expect(resolveMcpUrl()).toBeUndefined();
    });
  });

  describe('loadRuntimeConfig', () => {
    it('loads the public MCP base URL from runtime config', async () => {
      Object.defineProperty(window, 'fetch', {
        configurable: true,
        value: jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ mcpPublicBaseUrl: 'https://runtime-mcp.example.test ' }),
        } as Response),
      });

      await loadRuntimeConfig();

      expect(resolveMcpPublicBaseUrl()).toBe('https://runtime-mcp.example.test');
    });

    it('keeps static defaults when runtime config cannot be loaded', async () => {
      Object.defineProperty(window, 'fetch', {
        configurable: true,
        value: jest.fn().mockRejectedValue(new Error('offline')),
      });
      environment.mcpPublicBaseUrl = 'https://static-mcp.example.test';

      await loadRuntimeConfig();

      expect(resolveMcpPublicBaseUrl()).toBe('https://static-mcp.example.test');
    });
  });

  describe('derived MCP OAuth URLs', () => {
    it('derives endpoint and discovery URLs from desktop MCP URL', () => {
      setDesktopConfig({
        appMode: 'desktop',
        pocketbaseUrl: 'http://127.0.0.1:8090',
        mcpUrl: 'http://127.0.0.1:8081/mcp',
      });

      expect(resolveMcpPublicBaseUrl()).toBe('http://127.0.0.1:8081');
      expect(resolveMcpEndpointUrl()).toBe('http://127.0.0.1:8081/mcp');
      expect(resolveOAuthDiscoveryUrl()).toBe('http://127.0.0.1:8081/.well-known/oauth-protected-resource');
    });

    it('derives endpoint and discovery URLs from runtime public MCP base URL', () => {
      setRuntimeConfig({ mcpPublicBaseUrl: 'https://runtime-mcp.example.test/' });

      expect(resolveMcpPublicBaseUrl()).toBe('https://runtime-mcp.example.test');
      expect(resolveMcpEndpointUrl()).toBe('https://runtime-mcp.example.test/mcp');
      expect(resolveOAuthDiscoveryUrl()).toBe('https://runtime-mcp.example.test/.well-known/oauth-protected-resource');
    });

    it('derives endpoint and discovery URLs from static public MCP base URL', () => {
      environment.mcpPublicBaseUrl = 'https://static-mcp.example.test';

      expect(resolveMcpEndpointUrl()).toBe('https://static-mcp.example.test/mcp');
      expect(resolveOAuthDiscoveryUrl()).toBe('https://static-mcp.example.test/.well-known/oauth-protected-resource');
    });

    it('falls back to the current deployment host and default MCP port', () => {
      environment.mcpPublicBaseUrl = '';
      environment.pocketbaseUrl = 'http://pocketbase.example.test:8090';
      setDesktopConfig(undefined);

      expect(resolveMcpEndpointUrl()).toBe('http://pocketbase.example.test:8081/mcp');
      expect(resolveOAuthDiscoveryUrl()).toBe('http://pocketbase.example.test:8081/.well-known/oauth-protected-resource');
    });
  });
});
