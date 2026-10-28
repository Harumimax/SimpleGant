import { Pencil, Trash2, X } from 'lucide-react';
import { useId } from 'react';

import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import type { Task } from './tasks.api';

type Props = { task: Task; onClose: () => void; onEdit: () => void; onDelete: () => void };

export function TaskDetailsDialog({ task, onClose, onEdit, onDelete }: Props) {
  const titleId = useId();
  const rows = [
    ['Тип работ', task.workType || '—'],
    ['Ответственный', task.assignee || '—'],
    [
      'Длительность',
      task.duration === null || task.duration === undefined
        ? '—'
        : `${task.duration} дн.`,
    ],
    ['Статус', task.status],
    ['Начало', task.startDate || 'Не указано'],
    ['Окончание', task.endDate || 'Не указано'],
    ['Комментарий', task.comment || '—'],
  ];
  return (
    <Modal labelledBy={titleId} onClose={onClose} tone="compact">
      <div className="ds-dialog-panel">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-5">
          <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Задача</p><h2 className="mt-1 break-words text-xl font-semibold" id={titleId}>{task.title}</h2></div>
          <Button aria-label="Закрыть" onClick={onClose} size="icon" variant="ghost"><X aria-hidden className="size-5" /></Button>
        </div>
        <dl className="divide-y divide-[var(--color-border)] px-5 py-2">
          {rows.map(([label, value]) => <div className="grid grid-cols-[120px_1fr] gap-4 py-3 text-sm" key={label}><dt className="text-[var(--color-text-muted)]">{label}</dt><dd className={`min-w-0 break-words font-medium ${label === 'Комментарий' ? 'whitespace-pre-wrap' : ''}`}>{value}</dd></div>)}
        </dl>
        <div className="flex flex-wrap justify-between gap-3 border-t border-[var(--color-border)] px-5 py-4">
          <Button onClick={onDelete} variant="danger"><Trash2 aria-hidden className="size-4" />Удалить</Button>
          <div className="flex gap-2"><Button onClick={onClose} variant="secondary">Закрыть</Button><Button onClick={onEdit}><Pencil aria-hidden className="size-4" />Редактировать</Button></div>
        </div>
      </div>
    </Modal>
  );
}
