import { CalendarDays, X } from 'lucide-react';
import { useId, useRef, useState, type FormEvent } from 'react';

import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { SelectField } from '../../components/ui/SelectField';
import { TextField } from '../../components/ui/TextField';
import { TASK_STATUSES, type Task, type TaskInput, type TaskStatus } from './tasks.api';

type TaskDialogProps = {
  task?: Task | null;
  isPending: boolean;
  serverError?: string;
  onClose: () => void;
  onSubmit: (input: TaskInput) => void;
};

export function TaskDialog({ task, isPending, serverError, onClose, onSubmit }: TaskDialogProps) {
  const titleId = useId();
  const endDateRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(task?.title ?? '');
  const [workType, setWorkType] = useState(task?.workType ?? '');
  const [assignee, setAssignee] = useState(task?.assignee ?? '');
  const [estimate, setEstimate] = useState(task?.estimate ?? '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'Ожидает');
  const [startDate, setStartDate] = useState(task?.startDate ?? '');
  const [endDate, setEndDate] = useState(task?.endDate ?? '');
  const [excludeWeekends, setExcludeWeekends] = useState(true);
  const [formError, setFormError] = useState('');

  function optionalValue(value: string) {
    const trimmed = value.trim();
    if (task) return trimmed || null;
    return trimmed || undefined;
  }

  function optionalDate(value: string) {
    if (task) return value || null;
    return value || undefined;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (startDate && endDate && startDate > endDate) {
      setFormError('Дата окончания не может быть раньше даты начала');
      endDateRef.current?.focus();
      return;
    }
    setFormError('');
    onSubmit({
      title: title.trim(),
      workType: optionalValue(workType),
      assignee: assignee.trim(),
      estimate: optionalValue(estimate),
      status,
      startDate: optionalDate(startDate),
      endDate: optionalDate(endDate),
      ...(!task ? { excludeWeekends } : {}),
    });
  }

  return (
    <Modal isDismissible={!isPending} labelledBy={titleId} onClose={onClose}>
      <div className="ds-dialog-panel">
        <div className="flex items-start justify-between gap-5 border-b border-[var(--color-border)] px-5 py-5 sm:px-7">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em]" id={titleId}>
              {task ? 'Редактировать задачу' : 'Новая задача'}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-muted)]">
              Название и ответственный обязательны. Если указать одну дату, сервис рассчитает вторую.
            </p>
          </div>
          <Button aria-label="Закрыть" disabled={isPending} onClick={onClose} size="icon" type="button" variant="ghost">
            <X aria-hidden className="size-5" />
          </Button>
        </div>

        <form className="px-5 py-6 sm:px-7" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField autoFocus disabled={isPending} label="Название" maxLength={200} onChange={(event) => setTitle(event.target.value)} required value={title} />
            </div>
            <TextField disabled={isPending} label="Тип работ" maxLength={200} onChange={(event) => setWorkType(event.target.value)} value={workType} />
            <TextField disabled={isPending} label="Ответственный" maxLength={200} onChange={(event) => setAssignee(event.target.value)} required value={assignee} />
            <TextField disabled={isPending} label="Оценка" maxLength={100} onChange={(event) => setEstimate(event.target.value)} placeholder="Например, 5 дней" value={estimate} />
            <SelectField disabled={isPending} label="Статус" onChange={(event) => setStatus(event.target.value as TaskStatus)} value={status}>
              {TASK_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
            </SelectField>
            <TextField disabled={isPending} icon={<CalendarDays aria-hidden className="size-[18px]" />} label="Начало задачи" onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} />
            <TextField disabled={isPending} error={formError || undefined} icon={<CalendarDays aria-hidden className="size-[18px]" />} label="Конец задачи" min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} ref={endDateRef} type="date" value={endDate} />
          </div>

          {!task ? (
            <label className="mt-5 flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4 text-sm">
              <input checked={excludeWeekends} className="mt-0.5 size-4 accent-[var(--color-primary)]" disabled={isPending} onChange={(event) => setExcludeWeekends(event.target.checked)} type="checkbox" />
              <span><span className="font-semibold">Не учитывать выходные дни</span><span className="mt-1 block text-xs leading-5 text-[var(--color-text-muted)]">Применяется только когда заполнена одна из дат.</span></span>
            </label>
          ) : null}

          {serverError ? <div className="mt-5"><Alert>{serverError}</Alert></div> : null}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button disabled={isPending} onClick={onClose} type="button" variant="secondary">Отмена</Button>
            <Button isLoading={isPending} loadingLabel="Сохраняем…" type="submit">{task ? 'Сохранить задачу' : 'Создать задачу'}</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
