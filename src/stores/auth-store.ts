'use client';

import { create } from 'zustand';

import {
  login,
  registerAccount,
  type RegisterRequest,
  type TokenResponse,
} from '@/lib/auth-client';

const AUTH_STORAGE_KEY = 'expensia.auth.v1';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

export type AuthSession = TokenResponse & {
  email: string;
};

interface AuthState {
  status: AuthStatus;
  token: string | null;
  expiresAt: string | null;
  email: string | null;
  initialize: () => void;
  setSession: (session: AuthSession) => void;
  clearAuth: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  signOut: () => void;
}

function authSessionIsExpired(expiresAt: string) {
  const expiresAtMs = Date.parse(expiresAt);

  return Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawSession) {
      return null;
    }

    const session = JSON.parse(rawSession) as Partial<AuthSession>;

    if (!session.token || !session.expiresAt || !session.email) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    if (authSessionIsExpired(session.expiresAt)) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return {
      token: session.token,
      expiresAt: session.expiresAt,
      email: session.email,
    };
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function writeStoredSession(session: AuthSession) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function removeStoredSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'checking',
  token: null,
  expiresAt: null,
  email: null,
  initialize: () => {
    const session = readStoredSession();

    if (!session) {
      set({
        status: 'unauthenticated',
        token: null,
        expiresAt: null,
        email: null,
      });
      return;
    }

    set({
      status: 'authenticated',
      token: session.token,
      expiresAt: session.expiresAt,
      email: session.email,
    });
  },
  setSession: (session) => {
    const normalizedSession = {
      ...session,
      email: normalizeEmail(session.email),
    };

    writeStoredSession(normalizedSession);
    set({
      status: 'authenticated',
      token: normalizedSession.token,
      expiresAt: normalizedSession.expiresAt,
      email: normalizedSession.email,
    });
  },
  clearAuth: () => {
    removeStoredSession();
    set({
      status: 'unauthenticated',
      token: null,
      expiresAt: null,
      email: null,
    });
  },
  signIn: async (email, password) => {
    const normalizedEmail = normalizeEmail(email);
    const auth = await login({ email: normalizedEmail, password });

    get().setSession({ ...auth, email: normalizedEmail });
  },
  register: async (request) => {
    const normalizedRequest = {
      ...request,
      email: normalizeEmail(request.email),
      timezone: request.timezone.trim(),
    };

    await registerAccount(normalizedRequest);
    await get().signIn(normalizedRequest.email, normalizedRequest.password);
  },
  signOut: () => {
    get().clearAuth();
  },
}));

export function currentAuthToken() {
  const { token, expiresAt, clearAuth } = useAuthStore.getState();

  if (!token || !expiresAt) {
    return null;
  }

  if (authSessionIsExpired(expiresAt)) {
    clearAuth();
    return null;
  }

  return token;
}
