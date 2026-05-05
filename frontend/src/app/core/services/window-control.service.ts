import { Injectable } from '@angular/core';
import { isDesktopMode } from '../../core/utils/desktop-runtime-config';

@Injectable({ providedIn: 'root' })
export class WindowControlService {
  private readonly isDesktop = isDesktopMode();

  async minimize(): Promise<void> {
    if (!this.isDesktop) return;
    await fetch('/api/window/minimize', { method: 'POST' });
  }

  async maximize(): Promise<void> {
    if (!this.isDesktop) return;
    await fetch('/api/window/maximize', { method: 'POST' });
  }

  async unmaximize(): Promise<void> {
    if (!this.isDesktop) return;
    await fetch('/api/window/unmaximize', { method: 'POST' });
  }

  async close(): Promise<void> {
    if (!this.isDesktop) return;
    await fetch('/api/window/close', { method: 'POST' });
  }

  async getState(): Promise<{ minimized: boolean; maximized: boolean; fullscreen: boolean } | null> {
    if (!this.isDesktop) return null;
    try {
      const response = await fetch('/api/window/state');
      return await response.json();
    } catch {
      return null;
    }
  }
}
