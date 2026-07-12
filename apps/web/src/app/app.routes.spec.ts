import { routes } from './app.routes';
import { authGuard, guestOnlyGuard } from './core/guards/auth.guard';
import { cvAccessGuard } from './core/guards/cv-access.guard';

describe('app routes', () => {
  it('keeps MCP tokens as the only MCP home page', () => {
    const paths = routes.map((route) => route.path);

    expect(paths).toContain('home/tokens');
    expect(paths).not.toContain('home/mcp-config');
  });

  it('configures guards and path matching for all app routes', () => {
    expect(route('')).toMatchObject({ pathMatch: 'full' });
    expect(route('desktop')?.canActivate).toBeUndefined();
    expect(route('desktop/users/setup')?.canActivate).toBeUndefined();
    expect(route('login')?.canActivate).toEqual([guestOnlyGuard]);
    expect(route('home')).toMatchObject({ pathMatch: 'full', canActivate: [authGuard] });
    expect(route('home/profiles/:profileId/edit')?.canActivate).toEqual([authGuard]);
    expect(route('home/profile-material')?.canActivate).toEqual([authGuard]);
    expect(route('home/tokens')?.canActivate).toEqual([authGuard]);
    expect(route('home/templates')?.canActivate).toBeUndefined();
    expect(route('home/privacy')?.canActivate).toBeUndefined();
    expect(route('not-found')?.canActivate).toBeUndefined();
    expect(route(':slug')?.canActivate).toEqual([cvAccessGuard]);
    expect(route('**')).toMatchObject({ pathMatch: 'full' });
  });

  it('places not-found before the slug catch route', () => {
    const paths = routes.map((entry) => entry.path);

    expect(paths.indexOf('not-found')).toBeLessThan(paths.indexOf(':slug'));
  });

  function route(path: string) {
    return routes.find((entry) => entry.path === path);
  }
});
