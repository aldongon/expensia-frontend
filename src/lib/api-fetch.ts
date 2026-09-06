'use client';

import { apiUrl } from '@/lib/auth-client';
import { readProblem } from '@/lib/problem';
import { useAuthStore } from '@/stores/auth-store';

function mergeHeaders(initHeaders: HeadersInit | undefined, token: string) {
  const headers = new Headers(initHeaders);
  headers.set('Authorization', `Bearer ${token}`);

  return headers;
}

/**
 * Authenticated fetch wrapper. There is no refresh token in Expensia (the JWT lasts 24h and the
 * user must log in again after it expires), so a 401 simply clears the session and rethrows —
 * `AuthGuard` picks up the status change and redirects to /login.
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = useAuthStore.getState().token;

  const response = await fetch(apiUrl(input), {
    ...init,
    headers: token ? mergeHeaders(init.headers, token) : init.headers,
  });

  if (response.status === 401) {
    useAuthStore.getState().clearAuth();
  }

  return response;
}

/**
 * Reads a JSON body, returning `null` when the response has no body — the shape of
 * `GET /api/budgets/current` when the user has no budget for the current month, which is a valid
 * 200 response, not an error.
 */
export async function readOptionalJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text) as T;
}

export async function ensureOk(response: Response, fallbackMessage: string) {
  if (!response.ok) {
    await readProblem(response, fallbackMessage);
  }
}
