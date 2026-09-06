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

export async function login(email: string, password: string): Promise<TokenResponse> {
  const response = await fetch(authUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    await readProblem(response, 'No se pudo iniciar sesión.');
  }

  return response.json() as Promise<TokenResponse>;
}
