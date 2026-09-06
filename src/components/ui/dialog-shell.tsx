'use client';

import { Dialog } from '@base-ui/react/dialog';

import { cn } from '@/lib/utils';

interface DialogShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  widthClassName?: string;
  children: React.ReactNode;
}

/** Wraps @base-ui/react/dialog with the Nocturne .dialog-backdrop/.dialog classes. */
export function DialogShell({
  open,
  onOpenChange,
  title,
  widthClassName,
  children,
}: DialogShellProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop" />
        <Dialog.Popup className={cn('dialog', widthClassName)}>
          <Dialog.Title className="dialog-title">{title}</Dialog.Title>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
