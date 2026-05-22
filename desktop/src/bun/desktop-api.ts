export const DESKTOP_API_TOKEN_HEADER = 'x-resumate-desktop-api-token';

export function validateDesktopApiRequest(request: Request, desktopApiToken: string): Response | null {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  if (request.headers.get(DESKTOP_API_TOKEN_HEADER) !== desktopApiToken) {
    return jsonResponse({ error: 'Unauthorized.' }, 401);
  }

  return null;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
