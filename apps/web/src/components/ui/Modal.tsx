import { useEffect, useRef, type ReactNode } from 'react';

type ModalProps = {
  children: ReactNode;
  labelledBy: string;
  onClose: () => void;
  isDismissible?: boolean;
  tone?: 'default' | 'compact';
};

export function Modal({
  children,
  labelledBy,
  onClose,
  isDismissible = true,
  tone = 'default',
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }

    dialog
      .querySelector<HTMLElement>('[data-modal-autofocus="true"]')
      ?.focus();

    return () => {
      if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      aria-labelledby={labelledBy}
      className={`ds-dialog w-[calc(100%-24px)] border-0 bg-transparent p-0 text-[var(--color-text)] ${tone === 'compact' ? 'max-w-md' : 'max-w-lg'}`}
      onCancel={(event) => {
        event.preventDefault();
        if (isDismissible) onClose();
      }}
      ref={dialogRef}
    >
      {children}
    </dialog>
  );
}
