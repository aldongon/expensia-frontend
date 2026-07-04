import type { SVGProps } from 'react';

import { cn } from '@/lib/utils';

type BrandLogoProps = SVGProps<SVGSVGElement> & {
  markOnly?: boolean;
};

export function BrandLogo({ className, markOnly = false, ...props }: BrandLogoProps) {
  return (
    <svg
      viewBox={markOnly ? '0 0 128 128' : '0 0 560 128'}
      role="img"
      aria-label="Expensia"
      className={cn('block h-auto text-slate-950 dark:text-white', className)}
      {...props}
    >
      <rect x="9" y="9" width="110" height="110" rx="28" fill="currentColor" opacity="0.1" />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M35 30.5A9.5 9.5 0 0 1 44.5 21h39A9.5 9.5 0 0 1 93 30.5v67a9.5 9.5 0 0 1-13.9 8.4l-8.2-4.3a14.8 14.8 0 0 0-13.8 0l-8.2 4.3A9.5 9.5 0 0 1 35 97.5v-67Zm18 19a5 5 0 0 0 0 10h22a5 5 0 0 0 0-10H53Zm0 20a5 5 0 0 0 0 10h13a5 5 0 0 0 0-10H53Z"
        clipRule="evenodd"
      />
      {markOnly ? null : (
        <text
          x="148"
          y="86"
          fill="currentColor"
          fontFamily="Arial Black, Arial, Helvetica, sans-serif"
          fontSize="68"
          fontWeight="900"
        >
          EXPENSIA
        </text>
      )}
    </svg>
  );
}
