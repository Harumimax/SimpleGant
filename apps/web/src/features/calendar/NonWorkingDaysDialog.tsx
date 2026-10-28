import { CalendarOff, Trash2, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useId, useState, type FormEvent } from 'react';

import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TextField } from '../../components/ui/TextField';
import type {
  NonWorkingDay,
  NonWorkingDayInput,
} from './non-working-days.api';

type Props = {
  days: NonWorkingDay[];
  projectStartDate: string;
  projectEndDate: string;
  isPending: boolean;
  serverError?: string;
  onClose: () => void;
  onAdd: (input: NonWorkingDayInput) => void;
  onDelete: (dayId: string) => void;
};

function formatDate(value: string) {
  return format(parseISO(value), 'd MMMM yyyy', { locale: ru });
}

export function NonWorkingDaysDialog({
  days,
  projectStartDate,
  projectEndDate,
  isPending,
  serverError,
  onClose,
  onAdd,
  onDelete,
}: Props) {
  const titleId = useId();
  const [date, setDate] = useState(projectStartDate);
  const [label, setLabel] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (date < projectStartDate || date > projectEndDate) {
      setFormError('Дата должна входить в период проекта');
      return;
    }
    if (days.some((day) => day.date === date)) {
      setFormError('Эта дата уже отмечена как нерабочая');
      return;
    }
    setFormError('');
    onAdd({ date, label: label.trim() || undefined });
  }

  return (
    <Modal isDismissible={!isPending} labelledBy={titleId} onClose={onClose}>
      <div className="ds-dialog-panel">
        <div className="flex items-start justify-between gap-5 border-b border-[var(--color-border)] px-5 py-5 sm:px-7">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em]" id={titleId}>Нерабочие дни</h2>
            <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-muted)]">Отметьте праздники и другие даты, которые нужно пропускать при автоматическом расчёте сроков.</p>
          </div>
          <Button aria-label="Закрыть" disabled={isPending} onClick={onClose} size="icon" type="button" variant="ghost"><X aria-hidden className="size-5" /></Button>
        </div>

        <div className="max-h-[72vh] overflow-y-auto px-5 py-5 sm:px-7">
          {days.length > 0 ? (
            <div aria-label="Отмеченные нерабочие дни" className="mb-5 space-y-2">
              {days.map((day) => (
                <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-white p-3" key={day.id}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--color-non-working)] text-[var(--color-warning)]"><CalendarOff aria-hidden className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{formatDate(day.date)}</p>
                    <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">{day.label || 'Без названия'}</p>
                  </div>
                  {deletingId === day.id ? (
                    <div className="flex items-center gap-1">
                      <Button className="h-8 px-2 text-xs" disabled={isPending} onClick={() => setDeletingId(null)} type="button" variant="ghost">Нет</Button>
                      <Button className="h-8 px-2 text-xs" disabled={isPending} onClick={() => onDelete(day.id)} type="button" variant="danger">Удалить</Button>
                    </div>
                  ) : (
                    <Button aria-label={`Удалить ${formatDate(day.date)}`} disabled={isPending} onClick={() => setDeletingId(day.id)} size="icon" type="button" variant="ghost"><Trash2 aria-hidden className="size-4" /></Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-5 rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-subtle)] px-4 py-5 text-center text-sm text-[var(--color-text-muted)]">Дополнительные нерабочие дни пока не отмечены</div>
          )}

          <form className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4" onSubmit={handleSubmit}>
            <h3 className="mb-4 text-sm font-semibold">Добавить нерабочий день</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField disabled={isPending} label="Дата" max={projectEndDate} min={projectStartDate} onChange={(event) => setDate(event.target.value)} required type="date" value={date} />
              <TextField disabled={isPending} label="Название" maxLength={120} onChange={(event) => setLabel(event.target.value)} placeholder="Например, Новый год" value={label} />
            </div>
            {formError || serverError ? <div className="mt-4"><Alert>{formError || serverError}</Alert></div> : null}
            <div className="mt-5 flex justify-end"><Button isLoading={isPending} loadingLabel="Сохраняем…" type="submit">Добавить день</Button></div>
          </form>
        </div>
      </div>
    </Modal>
  );
}
