import { Injectable, computed, inject, signal } from '@angular/core';
import { User } from '../models/user.model';
import { PocketBaseClientService } from './pocketbase-client.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly pocketBaseClient = inject(PocketBaseClientService);
  private readonly pb = this.pocketBaseClient.pb;
  private readonly authRecord = signal<User | null>((this.pb.authStore.record as User | null) ?? null);
  private readonly authValid = signal(this.pb.authStore.isValid);

  readonly currentUser = computed(() => this.authRecord());
  readonly isAuthenticated = computed(() => this.authValid() && !!this.authRecord());

  constructor() {
    this.pb.authStore.onChange(() => {
      this.authRecord.set((this.pb.authStore.record as User | null) ?? null);
      this.authValid.set(this.pb.authStore.isValid);
    });
  }

  async login(identity: string, password: string): Promise<void> {
    await this.pb.collection('users').authWithPassword(identity, password);
    this.authRecord.set((this.pb.authStore.record as User | null) ?? null);
    this.authValid.set(this.pb.authStore.isValid);
  }

  logout(): void {
    this.pb.authStore.clear();
    this.authRecord.set(null);
    this.authValid.set(false);
  }

  getCurrentUserId(): string | null {
    return this.currentUser()?.id ?? null;
  }

  async refreshCurrentUser(): Promise<void> {
    const currentId = this.getCurrentUserId();
    if (!currentId) {
      return;
    }

    const user = await this.pb.collection<User>('users').getOne(currentId);
    this.authRecord.set(user);
    this.authValid.set(this.pb.authStore.isValid);
  }
}
