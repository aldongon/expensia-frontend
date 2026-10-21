'use client';

import Script from 'next/script';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';

import { env } from '@/env';
import { cn } from '@/lib/utils';

/** Google caps the rendered button between 200 and 400 px wide. */
const MIN_BUTTON_WIDTH = 200;
const MAX_BUTTON_WIDTH = 400;

interface GoogleSignInButtonProps {
  /** Receives the Google ID token once the user picks an account in Google's popup. */
  onCredential: (credential: string) => void;
  disabled?: boolean;
}

/**
 * Google's own "Continuar con Google" button (Google Identity Services). Google renders it inside
 * the container, so its look follows Google's branding rules; only its theme tracks ours.
 */
export function GoogleSignInButton({ onCredential, disabled = false }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const [scriptReady, setScriptReady] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!scriptReady || !window.google) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: (response) => onCredentialRef.current(response.credential),
    });
  }, [scriptReady]);

  useEffect(() => {
    const container = containerRef.current;

    if (!scriptReady || !window.google || !container) {
      return;
    }

    container.replaceChildren();
    window.google.accounts.id.renderButton(container, {
      type: 'standard',
      theme: resolvedTheme === 'dark' ? 'filled_black' : 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      locale: 'es',
      width: Math.min(MAX_BUTTON_WIDTH, Math.max(MIN_BUTTON_WIDTH, container.offsetWidth)),
    });
  }, [scriptReady, resolvedTheme]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div
        ref={containerRef}
        aria-busy={!scriptReady || disabled}
        className={cn(
          'flex min-h-10 w-full justify-center',
          disabled && 'pointer-events-none opacity-60'
        )}
      />
    </>
  );
}
