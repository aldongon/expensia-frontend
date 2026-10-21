'use client';

import { env } from '@/env';
import { readProblem } from '@/lib/problem';
import type { TokenResponse } from '@/types/api';

const API_URL = env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '');

function authUrl(path: string) {
  return `${API_URL}${path}`;
}

export function apiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return authUrl(path.startsWith('/') ? path : `/${path}`);
}

/**
 * Exchanges the Google ID token returned by Google Identity Services for the API's own JWT. The
 * browser's timezone is only used by the backend when this sign-in creates the account.
 */
export async function loginWithGoogle(idToken: string): Promise<TokenResponse> {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const response = await fetch(authUrl('/api/auth/google'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, timezone }),
  });

  if (!response.ok) {
    await readProblem(response, 'No se pudo iniciar sesión.');
  }

  return response.json() as Promise<TokenResponse>;
}
