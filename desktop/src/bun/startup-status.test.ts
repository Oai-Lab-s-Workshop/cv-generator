import { describe, expect, test } from 'bun:test';
import { STARTUP_STEPS, StartupStatusStore } from './startup-status';

describe('StartupStatusStore', () => {
  test('tracks start and ok transitions', () => {
    const store = new StartupStatusStore();

    store.start('BOOT-001', 'loading');
    let snapshot = store.snapshot();

    expect(snapshot.activeCode).toBe('BOOT-001');
    expect(snapshot.failedCode).toBeNull();
    expect(snapshot.steps.find((step) => step.code === 'BOOT-001')?.status).toBe('running');
    expect(snapshot.steps.find((step) => step.code === 'BOOT-001')?.detail).toBe('loading');

    store.ok('BOOT-001', 'loaded');
    snapshot = store.snapshot();

    expect(snapshot.activeCode).toBeNull();
    expect(snapshot.failedCode).toBeNull();
    expect(snapshot.steps.find((step) => step.code === 'BOOT-001')?.status).toBe('ok');
    expect(snapshot.steps.find((step) => step.code === 'BOOT-001')?.detail).toBe('loaded');
  });

  test('marks active step as failed', () => {
    const store = new StartupStatusStore();

    store.start('PB-050');
    store.failActive('PocketBase failed');
    const snapshot = store.snapshot();

    expect(snapshot.activeCode).toBe('PB-050');
    expect(snapshot.failedCode).toBe('PB-050');
    expect(snapshot.steps.find((step) => step.code === 'PB-050')?.status).toBe('failed');
    expect(snapshot.steps.find((step) => step.code === 'PB-050')?.detail).toBe('PocketBase failed');
  });

  test('returns defensive snapshot copies', () => {
    const store = new StartupStatusStore();
    const snapshot = store.snapshot();

    snapshot.steps[0].status = 'failed';
    snapshot.steps.push({ code: 'FAKE', message: 'fake', status: 'ok' } as never);

    const nextSnapshot = store.snapshot();

    expect(nextSnapshot.steps).toHaveLength(STARTUP_STEPS.length);
    expect(nextSnapshot.steps[0].status).toBe('pending');
  });
});
