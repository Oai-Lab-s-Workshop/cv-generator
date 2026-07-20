import { Injectable } from '@angular/core';
import { isDesktopMode, resolveDesktopRuntimeConfig } from '../../core/utils/desktop-runtime-config';

@Injectable({ providedIn: 'root' })
export class WindowControlService {
  private readonly isDesktop = isDesktopMode();
  private readonly config = resolveDesktopRuntimeConfig();

  async minimize(): Promise<void> {
    if (!this.isDesktop) return;
    await this.postWindowAction('/api/window/minimize');
  }

  async maximize(): Promise<void> {
    if (!this.isDesktop) return;
    await this.postWindowAction('/api/window/maximize');
  }

  async unmaximize(): Promise<void> {
    if (!this.isDesktop) return;
    await this.postWindowAction('/api/window/unmaximize');
  }

  async close(): Promise<void> {
    if (!this.isDesktop) return;
    await this.postWindowAction('/api/window/close');
  }

  async getState(): Promise<{ minimized: boolean; maximized: boolean; fullscreen: boolean } | null> {
    if (!this.isDesktop) return null;
    try {
      const response = await this.postWindowAction('/api/window/state');
      return await response.json();
    } catch {
      return null;
    }
  }

  private async postWindowAction(url: string): Promise<Response> {
    return await fetch(url, {
      method: 'POST',
      headers: this.desktopApiHeaders(),
    });
  }

  private desktopApiHeaders(): Record<string, string> {
    return this.config?.desktopApiToken ? { 'x-resumate-desktop-api-token': this.config.desktopApiToken } : {};
  }
}
