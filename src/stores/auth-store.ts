'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { loginWithGoogle } from '@/lib/auth-client';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  token: string | null;
  expiresAt: string | null;
  email: string | null;
  initialize: () => void;
  signInWithGoogle: (credential: string) => Promise<void>;
  clearAuth: () => void;
}

/**
 * Reads the email claim from a Google ID token for display only. The token is not verified here —
 * the backend verifies it — so nothing security-relevant may depend on this value.
 */
function emailFromGoogleCredential(credential: string): string | null {
  try {
    const payload = credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(payload)) as { email?: unknown };
    return typeof claims.email === 'string' ? claims.email : null;
  } catch {
    return null;
  }
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) {
    return true;
  }

  return new Date(expiresAt).getTime() <= Date.now();
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      status: 'checking',
      token: null,
      expiresAt: null,
      email: null,
      initialize: () => {
        const { token, expiresAt } = get();

        if (token && !isExpired(expiresAt)) {
          set({ status: 'authenticated' });
        } else {
          set({ status: 'unauthenticated', token: null, expiresAt: null });
        }
      },
      signInWithGoogle: async (credential) => {
        const auth = await loginWithGoogle(credential);

        set({
          status: 'authenticated',
          token: auth.token,
          expiresAt: auth.expiresAt,
          email: emailFromGoogleCredential(credential),
        });
      },
      clearAuth: () => {
        set({ status: 'unauthenticated', token: null, expiresAt: null, email: null });
      },
    }),
    {
      name: 'expensia-auth',
      partialize: (state) => ({
        token: state.token,
        expiresAt: state.expiresAt,
        email: state.email,
      }),
    }
  )
);
