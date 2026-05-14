import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { resolveDesktopRuntimeConfig } from '../../core/utils/desktop-runtime-config';
import { getErrorMessage } from '../../core/utils/error-message';

interface PasswordRule {
  label: string;
  isMet: boolean;
}

type UserCreateBody = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirm: string;
  verified: boolean;
  emailVisibility: boolean;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
};

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
  readonly passwordRules = computed<PasswordRule[]>(() => {
    const password = this.password();
    return [
      { label: 'At least 8 characters', isMet: password.length >= 8 },
      { label: 'One lowercase letter', isMet: /[a-z]/.test(password) },
      { label: 'One uppercase letter', isMet: /[A-Z]/.test(password) },
      { label: 'One number', isMet: /\d/.test(password) },
      { label: 'One symbol', isMet: /[^A-Za-z0-9\s]/.test(password) },
    ];
  });
  readonly missingPasswordRules = computed(() => this.passwordRules().filter((rule) => !rule.isMet).map((rule) => rule.label.toLowerCase()));
  readonly isPasswordValid = computed(() => this.missingPasswordRules().length === 0);
  readonly passwordHelper = computed(() => {
    const missingRules = this.missingPasswordRules();
    return missingRules.length > 0 ? `Missing: ${missingRules.join(', ')}.` : 'Password meets all requirements.';
  });
  readonly canSubmit = computed(() =>
    !!this.firstName().trim() &&
    !!this.lastName().trim() &&
    !!this.email().trim() &&
    this.isPasswordValid() &&
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
    const body: UserCreateBody = {
      firstName: this.firstName().trim(),
      lastName: this.lastName().trim(),
      email: this.email().trim(),
      password: this.password(),
      passwordConfirm: this.password(),
      verified: true,
      emailVisibility: true,
    };

    this.assignOptionalField(body, 'phone', this.phone());
    this.assignOptionalField(body, 'linkedin', this.linkedin());
    this.assignOptionalField(body, 'github', this.github());
    this.assignOptionalField(body, 'website', this.website());

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

  private assignOptionalField(body: UserCreateBody, field: 'phone' | 'linkedin' | 'github' | 'website', value: string): void {
    const trimmedValue = value.trim();
    if (trimmedValue) {
      body[field] = trimmedValue;
    }
  }
}
