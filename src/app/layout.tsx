import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Providers } from '@/providers';

import './globals.css';

export const metadata: Metadata = {
  title: 'Expensia',
  description: 'Panel de finanzas personales',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
