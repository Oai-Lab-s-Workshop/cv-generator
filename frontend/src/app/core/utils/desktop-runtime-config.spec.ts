import {
  isDesktopMode,
  resolveDesktopRuntimeConfig,
  resolveMcpUrl,
  resolvePocketBaseUrl,
} from './desktop-runtime-config';

describe('desktop-runtime-config utilities', () => {
  function setDesktopConfig(config: Record<string, unknown> | undefined) {
    (window as unknown as Record<string, unknown>)['__RESUMATE_DESKTOP_CONFIG__'] = config;
  }

  afterEach(() => {
    (window as unknown as Record<string, unknown>)['__RESUMATE_DESKTOP_CONFIG__'] = undefined;
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
});
