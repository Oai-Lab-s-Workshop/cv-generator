import { TestBed } from '@angular/core/testing';
import { PocketBaseClientService } from './pocketbase-client.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authStore: { record: unknown; isValid: boolean; onChange: jest.Mock; clear: jest.Mock };
  let users: { authWithPassword: jest.Mock; getOne: jest.Mock };
  let onChange: () => void;

  beforeEach(() => {
    authStore = {
      record: { id: 'user-1', firstName: 'Jane' },
      isValid: true,
      onChange: jest.fn((callback) => {
        onChange = callback;
      }),
      clear: jest.fn(() => {
        authStore.record = null;
        authStore.isValid = false;
      }),
    };
    users = {
      authWithPassword: jest.fn(async () => {
        authStore.record = { id: 'user-2' };
        authStore.isValid = true;
      }),
      getOne: jest.fn().mockResolvedValue({ id: 'user-1', firstName: 'Updated' }),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {
          provide: PocketBaseClientService,
          useValue: {
            pb: {
              authStore,
              collection: jest.fn(() => users),
            },
          },
        },
      ],
    });
  });

  it('initializes from PocketBase auth store and reacts to changes', () => {
    const service = TestBed.inject(AuthService);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.getCurrentUserId()).toBe('user-1');

    authStore.record = null;
    authStore.isValid = false;
    onChange();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.getCurrentUserId()).toBeNull();
  });

  it('logs in, refreshes and logs out', async () => {
    const service = TestBed.inject(AuthService);

    await service.login('jane@example.test', 'secret');
    expect(users.authWithPassword).toHaveBeenCalledWith('jane@example.test', 'secret');
    expect(service.getCurrentUserId()).toBe('user-2');

    await service.refreshCurrentUser();
    expect(users.getOne).toHaveBeenCalledWith('user-2');
    expect(service.currentUser()?.firstName).toBe('Updated');

    service.logout();
    expect(authStore.clear).toHaveBeenCalled();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('does not refresh when there is no current user', async () => {
    authStore.record = null;
    authStore.isValid = false;
    const service = TestBed.inject(AuthService);

    await service.refreshCurrentUser();

    expect(users.getOne).not.toHaveBeenCalled();
  });
});
