import { AlertTriangle, X } from 'lucide-react';

import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import type { Project } from './projects.api';

type Props = {
  project: Project;
  isPending: boolean;
  serverError?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteProjectDialog({
  project,
  isPending,
  serverError,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal
      isDismissible={!isPending}
      labelledBy="delete-project-title"
      onClose={onClose}
      tone="compact"
    >
      <div className="ds-dialog-panel p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-lg)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
            <AlertTriangle aria-hidden className="size-5" />
          </div>
          <Button
            aria-label="Закрыть"
            disabled={isPending}
            onClick={onClose}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X aria-hidden className="size-5" />
          </Button>
        </div>

        <h2
          className="mt-5 text-xl font-semibold tracking-[-0.02em] text-[var(--color-text)]"
          id="delete-project-title"
        >
          Удалить проект?
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)] text-pretty">
          «{project.name}» и все данные диаграммы будут удалены без возможности восстановления.
        </p>

        {serverError ? (
          <div className="mt-5">
            <Alert>{serverError}</Alert>
          </div>
        ) : null}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            disabled={isPending}
            onClick={onClose}
            type="button"
            variant="secondary"
          >
            Отмена
          </Button>
          <Button
            isLoading={isPending}
            loadingLabel="Удаляем…"
            onClick={onConfirm}
            type="button"
            variant="danger"
          >
            Удалить проект
          </Button>
        </div>
      </div>
    </Modal>
  );
}
