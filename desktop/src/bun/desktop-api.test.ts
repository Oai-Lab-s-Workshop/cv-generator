import { describe, expect, test } from 'bun:test';
import { DESKTOP_API_TOKEN_HEADER, validateDesktopApiRequest } from './desktop-api';

describe('validateDesktopApiRequest', () => {
  test('rejects non-POST requests', () => {
    const response = validateDesktopApiRequest(new Request('http://127.0.0.1/api/window/close'), 'token');

    expect(response?.status).toBe(405);
  });

  test('rejects missing desktop API token', () => {
    const response = validateDesktopApiRequest(new Request('http://127.0.0.1/api/window/close', { method: 'POST' }), 'token');

    expect(response?.status).toBe(401);
  });

  test('accepts POST requests with the desktop API token', () => {
    const response = validateDesktopApiRequest(new Request('http://127.0.0.1/api/window/close', {
      method: 'POST',
      headers: { [DESKTOP_API_TOKEN_HEADER]: 'token' },
    }), 'token');

    expect(response).toBeNull();
  });
});
