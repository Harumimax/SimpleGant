import { Check, Copy, Link2, X } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

type Props = {
  publicUrl: string;
  onClose: () => void;
};

export function ShareProjectDialog({ publicUrl, onClose }: Props) {
  const titleId = useId();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  }

  return (
    <Modal labelledBy={titleId} onClose={onClose} tone="compact">
      <div className="ds-dialog-panel">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-5">
          <div>
            <h2 className="text-xl font-semibold" id={titleId}>Публичная ссылка</h2>
            <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-muted)]">
              Любой, у кого есть ссылка, сможет посмотреть сохранённую версию проекта без регистрации.
            </p>
          </div>
          <Button aria-label="Закрыть" onClick={onClose} size="icon" variant="ghost">
            <X aria-hidden className="size-5" />
          </Button>
        </div>
        <div className="px-5 py-5">
          <label className="block text-sm font-semibold" htmlFor="public-project-url">
            Ссылка для просмотра
          </label>
          <div className="mt-2 flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Link2 aria-hidden className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-faint)]" />
              <input
                className="h-11 w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface-subtle)] pl-10 pr-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-focus)]"
                id="public-project-url"
                onFocus={(event) => event.currentTarget.select()}
                readOnly
                value={publicUrl}
              />
            </div>
            <Button aria-live="polite" onClick={() => void copyLink()} type="button">
              {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
              {copied ? 'Скопировано' : 'Копировать'}
            </Button>
          </div>
          <p className="mt-3 text-xs leading-5 text-[var(--color-text-muted)]">
            Ссылка постоянная. Изменения станут видны по ней после нажатия «Сохранить изменения».
          </p>
          {copyError ? (
            <p className="mt-2 text-xs text-[var(--color-danger)]" role="alert">
              Не удалось скопировать ссылку автоматически. Выделите её и скопируйте вручную.
            </p>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
