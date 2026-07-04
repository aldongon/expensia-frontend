'use client';

import { apiUrl } from '@/lib/auth-client';
import { currentAuthToken, useAuthStore } from '@/stores/auth-store';

function withAuthHeader(initHeaders: HeadersInit | undefined, token: string) {
  const headers = new Headers(initHeaders);

  headers.set('Authorization', `Bearer ${token}`);

  return headers;
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = currentAuthToken();

  if (!token) {
    useAuthStore.getState().clearAuth();
    throw new Error('No hay una sesión activa.');
  }

  const response = await fetch(apiUrl(input), {
    ...init,
    headers: withAuthHeader(init.headers, token),
  });

  if (response.status === 401) {
    useAuthStore.getState().clearAuth();
  }

  return response;
}

export * from '@/lib/auth-client';
