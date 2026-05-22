import { generateAiTokenSecret, getAiTokenPrefix } from './ai-token';

describe('ai-token utilities', () => {
  const originalGetRandomValues = globalThis.crypto.getRandomValues;
  const originalSubtleDigest = globalThis.crypto.subtle?.digest;

  afterEach(() => {
    globalThis.crypto.getRandomValues = originalGetRandomValues;
    if (globalThis.crypto.subtle) {
      (globalThis.crypto.subtle as unknown as Record<string, unknown>)['digest'] = originalSubtleDigest;
    }
  });

  describe('generateAiTokenSecret', () => {
    it('returns a string with the resm_ prefix', () => {
      // Mock getRandomValues to fill with predictable bytes
      globalThis.crypto.getRandomValues = ((array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = 65 + (i % 26); // A-Z
        }
        return array;
      }) as Crypto['getRandomValues'];

      const token = generateAiTokenSecret();

      expect(token).toMatch(/^resm_/);
      // base64url encoded 24 bytes of A-Z
      expect(token.length).toBeGreaterThan(5);
    });

    it('generates different tokens on each call', () => {
      let call = 0;
      globalThis.crypto.getRandomValues = ((array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = (call + i * 3) % 256;
        }
        call++;
        return array;
      }) as Crypto['getRandomValues'];

      const token1 = generateAiTokenSecret();
      const token2 = generateAiTokenSecret();

      expect(token1).not.toBe(token2);
    });
  });

  describe('getAiTokenPrefix', () => {
    it('extracts the first 16 characters', () => {
      const prefix = getAiTokenPrefix('abcdefghijklmnop123456');

      expect(prefix).toBe('abcdefghijklmnop');
      expect(prefix.length).toBe(16);
    });

    it('returns the full string when shorter than 16 characters', () => {
      const prefix = getAiTokenPrefix('short');

      expect(prefix).toBe('short');
    });

    it('returns an empty string for an empty token', () => {
      const prefix = getAiTokenPrefix('');

      expect(prefix).toBe('');
    });
  });
});
