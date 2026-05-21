import { routes } from './app.routes';

describe('app routes', () => {
  it('keeps MCP tokens as the only MCP home page', () => {
    const paths = routes.map((route) => route.path);

    expect(paths).toContain('home/tokens');
    expect(paths).not.toContain('home/mcp-config');
  });
});
