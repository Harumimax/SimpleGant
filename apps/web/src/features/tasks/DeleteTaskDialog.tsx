import { AlertTriangle, X } from 'lucide-react';

import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import type { Task } from './tasks.api';

type Props = { task: Task; descendantCount?: number; isPending: boolean; serverError?: string; onClose: () => void; onConfirm: () => void };

export function DeleteTaskDialog({ task, descendantCount = 0, isPending, serverError, onClose, onConfirm }: Props) {
  return (
    <Modal isDismissible={!isPending} labelledBy="delete-task-title" onClose={onClose} tone="compact">
      <div className="ds-dialog-panel p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="grid size-11 place-items-center rounded-[var(--radius-lg)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]"><AlertTriangle aria-hidden className="size-5" /></div>
          <Button aria-label="Закрыть" disabled={isPending} onClick={onClose} size="icon" variant="ghost"><X aria-hidden className="size-5" /></Button>
        </div>
        <h2 className="mt-5 text-xl font-semibold" id="delete-task-title">Удалить задачу?</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          «{task.title}» будет удалена без возможности восстановления.
          {descendantCount > 0
            ? ` Вместе с ней будут удалены вложенные задачи: ${descendantCount}.`
            : ''}
        </p>
        {serverError ? <div className="mt-5"><Alert>{serverError}</Alert></div> : null}
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button disabled={isPending} onClick={onClose} variant="secondary">Отмена</Button>
          <Button isLoading={isPending} loadingLabel="Удаляем…" onClick={onConfirm} variant="danger">Удалить задачу</Button>
        </div>
      </div>
    </Modal>
  );
}
