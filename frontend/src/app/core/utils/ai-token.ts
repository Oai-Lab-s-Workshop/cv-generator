const TOKEN_PREFIX = 'resm_';
const DEFAULT_RANDOM_BYTES = 24;

export function generateAiTokenSecret(): string {
  const bytes = new Uint8Array(DEFAULT_RANDOM_BYTES);
  crypto.getRandomValues(bytes);
  return `${TOKEN_PREFIX}${toBase64Url(bytes)}`;
}

export async function hashAiTokenSecret(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

export function getAiTokenPrefix(token: string): string {
  return token.slice(0, 16);
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
