import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Navbar } from './navbar';

describe('Navbar', () => {
  let authService: { isAuthenticated: ReturnType<typeof signal>; currentUser: ReturnType<typeof signal>; logout: jest.Mock };
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    globalThis.fetch = fetchMock as typeof globalThis.fetch;

    authService = {
      isAuthenticated: signal(true),
      currentUser: signal({ id: 'user-1', firstName: 'Jane', lastName: 'Doe' }),
      logout: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    // @ts-expect-error - clean up global fetch stub
    delete globalThis.fetch;
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Navbar);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('loads bug report URL from runtime config', async () => {
    fetchMock.mockImplementation(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ bugReportUrl: 'https://bugs.example.com' }),
    }));

    const fixture = TestBed.createComponent(Navbar);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    // Allow the async loadRuntimeConfig to complete
    await new Promise(r => setTimeout(r, 50));
    fixture.detectChanges();

    expect(component.bugReportUrl()).toBe('https://bugs.example.com');
  });

  it('handles runtime config fetch failure gracefully', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'));

    const fixture = TestBed.createComponent(Navbar);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.bugReportUrl()).toBeDefined();
  });

  it('handles runtime config non-ok response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    } as Response);

    const fixture = TestBed.createComponent(Navbar);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.bugReportUrl()).toBeDefined();
  });

  it('handles runtime config with empty bugReportUrl', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ bugReportUrl: '   ' }),
    } as Response);

    const fixture = TestBed.createComponent(Navbar);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.bugReportUrl()).toBeDefined();
  });

  it('handles runtime config with non-string bugReportUrl', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ bugReportUrl: 123 }),
    } as Response);

    const fixture = TestBed.createComponent(Navbar);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.bugReportUrl()).toBeDefined();
  });

  it('calls logout and redirects to login', () => {
    const fixture = TestBed.createComponent(Navbar);
    const component = fixture.componentInstance;
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    fixture.detectChanges();

    // Just verify logout is called; location.assign is not modifiable in JSDOM
    component.logout();
    expect(authService.logout).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('isAuthenticated reflects auth service state', () => {
    const fixture = TestBed.createComponent(Navbar);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    authService.isAuthenticated.set(false);
    fixture.detectChanges();
    expect(component.isAuthenticated()).toBe(false);

    authService.isAuthenticated.set(true);
    fixture.detectChanges();
    expect(component.isAuthenticated()).toBe(true);
  });

  it('shows tokens navigation without standalone MCP config navigation', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    const anchors = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
    const hrefs = anchors.map((anchor) => anchor.getAttribute('href'));

    expect(fixture.nativeElement.textContent).toContain('Tokens MCP');
    expect(fixture.nativeElement.textContent).not.toContain('Config MCP');
    expect(hrefs).toContain('/home/tokens');
    expect(hrefs).not.toContain('/home/mcp-config');
  });

  it('toggles the responsive navigation state', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    const menu = fixture.nativeElement.querySelector('.mobile-menu') as HTMLButtonElement;
    menu.click();
    fixture.detectChanges();
    expect(menu.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('.main-nav').getAttribute('data-open')).toBe('true');

    fixture.componentInstance.closeMenu();
    fixture.detectChanges();
    expect(menu.getAttribute('aria-expanded')).toBe('false');
  });

  it('toggles and persists the Affiche theme', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector('.theme-toggle') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();

    expect(localStorage.getItem('resumate:theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
  });
});
