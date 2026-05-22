import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.removeProperty('color-scheme');
  });

  it('initializes from localStorage and applies the theme', () => {
    localStorage.setItem('theme', 'dark');

    const service = new ThemeService();

    expect(service.currentTheme()).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('color-scheme')).toBe('dark');
  });

  it('falls back to system for unsupported stored values', () => {
    localStorage.setItem('theme', 'neon');

    const service = new ThemeService();

    expect(service.currentTheme()).toBe('system');
    expect(document.documentElement.style.getPropertyValue('color-scheme')).toBe('');
  });

  it('sets and toggles themes through the supported cycle', () => {
    const service = new ThemeService();

    service.setTheme('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.style.getPropertyValue('color-scheme')).toBe('light');

    service.toggle();
    expect(service.currentTheme()).toBe('dark');
    service.toggle();
    expect(service.currentTheme()).toBe('system');
    expect(document.documentElement.style.getPropertyValue('color-scheme')).toBe('');
    service.toggle();
    expect(service.currentTheme()).toBe('light');
  });
});
