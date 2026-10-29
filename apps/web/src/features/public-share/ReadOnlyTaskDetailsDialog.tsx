import { X } from 'lucide-react';
import { useId } from 'react';

import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import type { ProjectColumn } from '../projects/projects.api';
import type { Task } from '../tasks/tasks.api';
import { taskValue } from '../gantt/taskValue';
import { taskPeriods } from '../gantt/taskPeriods';

type Props = {
  task: Task;
  columns: ProjectColumn[];
  onClose: () => void;
};

export function ReadOnlyTaskDetailsDialog({ task, columns, onClose }: Props) {
  const titleId = useId();
  const detailColumns = [...columns]
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .filter(({ key }) => key !== 'title');
  const periods = taskPeriods(task);

  return (
    <Modal labelledBy={titleId} onClose={onClose} tone="compact">
      <div className="ds-dialog-panel">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[var(--color-text-muted)]">Задача</p>
            <h2 className="mt-1 break-words text-xl font-semibold" id={titleId}>{task.title}</h2>
          </div>
          <Button aria-label="Закрыть" onClick={onClose} size="icon" variant="ghost">
            <X aria-hidden className="size-5" />
          </Button>
        </div>
        <dl className="divide-y divide-[var(--color-border)] px-5 py-2">
          {detailColumns.map((column) => (
            <div className="grid grid-cols-[140px_1fr] gap-4 py-3 text-sm" key={column.id}>
              <dt className="text-[var(--color-text-muted)]">{column.name}</dt>
              <dd className="min-w-0 break-words font-medium">{String(taskValue(task, column.key))}</dd>
            </div>
          ))}
          <div className="grid grid-cols-[140px_1fr] gap-4 py-3 text-sm">
            <dt className="text-[var(--color-text-muted)]">Начало</dt>
            <dd className="font-medium">{task.startDate || 'Не указано'}</dd>
          </div>
          {periods.map((period, index) => (
            <div className="grid grid-cols-[140px_1fr] gap-4 py-3 text-sm" key={period.id}>
              <dt className="text-[var(--color-text-muted)]">{index === 0 ? 'Основной период' : `Период ${index + 1}`}</dt>
              <dd className="min-w-0 font-medium">
                <div className="break-words">{period.title}</div>
                <div className="mt-1 text-xs text-[var(--color-text-muted)]">{period.startDate} — {period.endDate}{period.includeInDuration ? '' : ' · не входит в длительность'}</div>
              </dd>
            </div>
          ))}
          <div className="grid grid-cols-[140px_1fr] gap-4 py-3 text-sm">
            <dt className="text-[var(--color-text-muted)]">Окончание</dt>
            <dd className="font-medium">{task.endDate || 'Не указано'}</dd>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-4 py-3 text-sm">
            <dt className="text-[var(--color-text-muted)]">Комментарий</dt>
            <dd className="min-w-0 whitespace-pre-wrap break-words font-medium">
              {task.comment || '—'}
            </dd>
          </div>
        </dl>
        <div className="flex justify-end border-t border-[var(--color-border)] px-5 py-4">
          <Button onClick={onClose} variant="secondary">Закрыть</Button>
        </div>
      </div>
    </Modal>
  );
}
