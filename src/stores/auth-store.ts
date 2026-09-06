'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { login as loginRequest } from '@/lib/auth-client';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  token: string | null;
  expiresAt: string | null;
  email: string | null;
  initialize: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  clearAuth: () => void;
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
      signIn: async (email, password) => {
        const auth = await loginRequest(email, password);

        set({
          status: 'authenticated',
          token: auth.token,
          expiresAt: auth.expiresAt,
          email,
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
