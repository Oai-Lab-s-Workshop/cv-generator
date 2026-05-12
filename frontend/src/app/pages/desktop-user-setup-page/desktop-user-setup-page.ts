import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { resolveDesktopRuntimeConfig } from '../../core/utils/desktop-runtime-config';
import { getErrorMessage } from '../../core/utils/error-message';

@Component({
  selector: 'app-desktop-user-setup-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './desktop-user-setup-page.html',
  styleUrl: './desktop-user-setup-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesktopUserSetupPage {
  private readonly config = resolveDesktopRuntimeConfig();

  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly phone = signal('');
  readonly linkedin = signal('');
  readonly github = signal('');
  readonly website = signal('');
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly canSubmit = computed(() =>
    !!this.firstName().trim() &&
    !!this.lastName().trim() &&
    !!this.email().trim() &&
    this.password().length >= 8 &&
    !this.isSaving(),
  );

  async createUser(): Promise<void> {
    if (!this.config?.pocketbaseUrl || !this.config.pocketbaseSuperuserEmail || !this.config.pocketbaseSuperuserPassword) {
      this.errorMessage.set('Desktop administrator credentials are unavailable.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const token = await this.authenticateSuperuser();
      await this.createPocketBaseUser(token);
      this.successMessage.set(`User ${this.email().trim()} created. You can now sign in.`);
      this.password.set('');
    } catch (error: unknown) {
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      this.isSaving.set(false);
    }
  }

  private async authenticateSuperuser(): Promise<string> {
    const payload = {
      identity: this.config?.pocketbaseSuperuserEmail,
      password: this.config?.pocketbaseSuperuserPassword,
    };
    const endpoints = [
      `${this.config?.pocketbaseUrl}/api/collections/_superusers/auth-with-password`,
      `${this.config?.pocketbaseUrl}/api/admins/auth-with-password`,
    ];

    for (const endpoint of endpoints) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = (await response.json()) as { token?: string };
        if (data.token) {
          return data.token;
        }
      }
    }

    throw new Error('Unable to authenticate the local PocketBase administrator.');
  }

  private async createPocketBaseUser(token: string): Promise<void> {
    const body = {
      firstName: this.firstName().trim(),
      lastName: this.lastName().trim(),
      email: this.email().trim(),
      password: this.password(),
      passwordConfirm: this.password(),
      verified: true,
      emailVisibility: true,
      phone: this.phone().trim(),
      linkedin: this.linkedin().trim(),
      github: this.github().trim(),
      website: this.website().trim(),
    };

    const response = await fetch(`${this.config?.pocketbaseUrl}/api/collections/users/records`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`User creation failed: ${await response.text()}`);
    }
  }
}
