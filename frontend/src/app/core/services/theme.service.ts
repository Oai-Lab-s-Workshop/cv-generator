import { Injectable, signal } from '@angular/core';

type Theme = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly currentTheme = signal<Theme>('system');

  constructor() {
    const saved = localStorage.getItem('theme') as Theme | null;
    this.currentTheme.set(saved === 'light' || saved === 'dark' ? saved : 'system');
    this.applyTheme();
  }

  toggle(): void {
    this.currentTheme.update((t) => {
      const next: Theme = t === 'light' ? 'dark' : t === 'dark' ? 'system' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
    this.applyTheme();
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    localStorage.setItem('theme', theme);
    this.applyTheme();
  }

  private applyTheme(): void {
    const t = this.currentTheme();
    if (t === 'system') {
      document.documentElement.style.removeProperty('color-scheme');
    } else {
      document.documentElement.style.setProperty('color-scheme', t);
    }
  }
}
