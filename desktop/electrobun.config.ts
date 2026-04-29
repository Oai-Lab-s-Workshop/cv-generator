import type { ElectrobunConfig } from 'electrobun';

const config: ElectrobunConfig = {
  app: {
    name: 'Resumate',
    identifier: 'app.resumate.desktop',
    version: '0.1.0',
    description: 'Local-first CV builder with embedded PocketBase and MCP services.',
    urlSchemes: ['resumate'],
  },
  build: {
    bun: {
      entrypoint: 'src/bun/index.ts',
    },
    copy: {
      'dist/angular': 'views/angular',
      'dist/resources': 'resources',
    },
    targets: 'current',
    useAsar: false,
    mac: {
      bundleCEF: true,
      defaultRenderer: 'cef',
      createDmg: false,
    },
    win: {
      bundleCEF: true,
      defaultRenderer: 'cef',
    },
    linux: {
      bundleCEF: true,
      defaultRenderer: 'cef',
    },
  },
  runtime: {
    exitOnLastWindowClosed: true,
  },
  release: {
    generatePatch: false,
  },
};

export default config;
