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
  const originalSessionStorage = window.sessionStorage;

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
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: originalSessionStorage,
    });
    try {
      window.sessionStorage?.removeItem('resumate:runtime-config');
    } catch {
      // Ignore if sessionStorage is not available
    }
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

    describe('sessionStorage caching', () => {
      let fetchMock: jest.Mock;
      let getItemMock: jest.Mock;
      let setItemMock: jest.Mock;

      function mockSessionStorage(getItemImpl?: jest.Mock, setItemImpl?: jest.Mock) {
        getItemMock = getItemImpl ?? jest.fn().mockReturnValue(null);
        setItemMock = setItemImpl ?? jest.fn();
        Object.defineProperty(window, 'sessionStorage', {
          configurable: true,
          value: {
            getItem: getItemMock,
            setItem: setItemMock,
          },
        });
      }

      beforeEach(() => {
        fetchMock = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ mcpPublicBaseUrl: 'https://fetched-mcp.example.test' }),
        } as Response);
        Object.defineProperty(window, 'fetch', {
          configurable: true,
          value: fetchMock,
        });
        mockSessionStorage();
      });

      it('uses cached config and skips fetch when cache is valid (within TTL)', async () => {
        const cachedConfig = { mcpPublicBaseUrl: 'https://cached-mcp.example.test' };
        mockSessionStorage(
          jest.fn().mockReturnValue(
            JSON.stringify({ data: cachedConfig, timestamp: Date.now() - 1_000 }),
          ),
        );

        await loadRuntimeConfig();

        expect(fetchMock).not.toHaveBeenCalled();
        expect(resolveMcpPublicBaseUrl()).toBe('https://cached-mcp.example.test');
      });

      it('fetches fresh config when cache entry is expired', async () => {
        const expiredConfig = { mcpPublicBaseUrl: 'https://expired-mcp.example.test' };
        mockSessionStorage(
          jest.fn().mockReturnValue(
            JSON.stringify({ data: expiredConfig, timestamp: Date.now() - 400_000 }),
          ),
        );

        await loadRuntimeConfig();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(resolveMcpPublicBaseUrl()).toBe('https://fetched-mcp.example.test');
      });

      it('fetches fresh config when no cache entry exists', async () => {
        mockSessionStorage(jest.fn().mockReturnValue(null));

        await loadRuntimeConfig();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(resolveMcpPublicBaseUrl()).toBe('https://fetched-mcp.example.test');
      });

      it('caches the fetched config in sessionStorage after a successful fetch', async () => {
        const setItemSpy = jest.fn();
        mockSessionStorage(jest.fn().mockReturnValue(null), setItemSpy);

        await loadRuntimeConfig();

        expect(setItemSpy).toHaveBeenCalledTimes(1);
        const setItemArgs = setItemSpy.mock.calls[0];
        expect(setItemArgs[0]).toBe('resumate:runtime-config');

        const cached = JSON.parse(setItemArgs[1]);
        expect(cached.data.mcpPublicBaseUrl).toBe('https://fetched-mcp.example.test');
        expect(typeof cached.timestamp).toBe('number');
        expect(cached.timestamp).toBeLessThanOrEqual(Date.now());
        expect(cached.timestamp).toBeGreaterThan(Date.now() - 10_000);
      });

      it('fetches config when sessionStorage is not available', async () => {
        Object.defineProperty(window, 'sessionStorage', {
          configurable: true,
          value: undefined,
        });

        await loadRuntimeConfig();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(resolveMcpPublicBaseUrl()).toBe('https://fetched-mcp.example.test');
      });

      it('handles corrupted cache gracefully by falling through to fetch', async () => {
        mockSessionStorage(jest.fn().mockReturnValue('not-valid-json{{{'));

        await loadRuntimeConfig();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(resolveMcpPublicBaseUrl()).toBe('https://fetched-mcp.example.test');
      });

      it('does not throw when setItem fails (e.g. quota exceeded)', async () => {
        mockSessionStorage(jest.fn().mockReturnValue(null), jest.fn().mockImplementation(() => {
          throw new Error('quota exceeded');
        }));

        await loadRuntimeConfig();

        // Should not throw; config is still set on window
        expect(resolveMcpPublicBaseUrl()).toBe('https://fetched-mcp.example.test');
      });
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
