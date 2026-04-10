import { Injectable, computed, inject, signal } from '@angular/core';
import { User } from '../models/user.model';
import { PocketBaseClientService } from './pocketbase-client.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly pocketBaseClient = inject(PocketBaseClientService);
  private readonly pb = this.pocketBaseClient.pb;
  private readonly authRecord = signal<User | null>((this.pb.authStore.record as User | null) ?? null);

  readonly currentUser = computed(() => this.authRecord());
  readonly isAuthenticated = computed(() => this.pb.authStore.isValid && !!this.authRecord());

  constructor() {
    this.pb.authStore.onChange(() => {
      this.authRecord.set((this.pb.authStore.record as User | null) ?? null);
    });
  }

  async login(identity: string, password: string): Promise<void> {
    await this.pb.collection('users').authWithPassword(identity, password);
    this.authRecord.set((this.pb.authStore.record as User | null) ?? null);
  }

  logout(): void {
    this.pb.authStore.clear();
    this.authRecord.set(null);
  }

  getCurrentUserId(): string | null {
    return this.currentUser()?.id ?? null;
  }
}
