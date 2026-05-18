import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { requireExecutable, toFileUrl } from './paths';

describe('desktop path helpers', () => {
  test('converts a path to a file URL', () => {
    expect(toFileUrl('/tmp/resumate/index.html')).toBe('file:///tmp/resumate/index.html');
  });

  test('throws when an executable is missing', () => {
    const missingPath = join(import.meta.dir, 'missing-executable');

    expect(() => requireExecutable(missingPath, 'PocketBase')).toThrow(
      `PocketBase is missing at ${missingPath}. Run desktop resource preparation for this platform first.`,
    );
  });
});
