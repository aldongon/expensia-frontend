'use client';

import { CheckCircle, CircleNotch, Info, Warning, WarningCircle } from '@phosphor-icons/react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={{
        success: <CheckCircle size={16} weight="fill" />,
        info: <Info size={16} weight="fill" />,
        warning: <Warning size={16} weight="fill" />,
        error: <WarningCircle size={16} weight="fill" />,
        loading: <CircleNotch size={16} className="animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
