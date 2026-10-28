import { CalendarDays, Trash2, X } from 'lucide-react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useId, useRef, useState, type FormEvent } from 'react';

import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { SelectField } from '../../components/ui/SelectField';
import { TextField } from '../../components/ui/TextField';
import type { ProjectColumn } from '../projects/projects.api';
import {
  isTaskColor,
  TASK_COLORS,
  TASK_STATUSES,
  TASK_WORK_TYPES,
  type Task,
  type TaskColor,
  type TaskInput,
  type TaskStatus,
} from './tasks.api';

const TASK_COLOR_NAMES: Record<TaskColor, string> = {
  sage: 'Шалфейный',
  blue: 'Синий',
  sky: 'Небесный',
  lavender: 'Лавандовый',
  plum: 'Сливовый',
  rose: 'Розовый',
  coral: 'Коралловый',
  sand: 'Песочный',
  amber: 'Янтарный',
  teal: 'Бирюзовый',
};

type TaskDialogProps = {
  task?: Task | null;
  isPending: boolean;
  serverError?: string;
  onClose: () => void;
  onDelete?: () => void;
  onSubmit: (input: TaskInput) => void;
  datesReadOnly?: boolean;
  columns?: ProjectColumn[];
};

export function TaskDialog({ task, isPending, serverError, onClose, onDelete, onSubmit, datesReadOnly = false, columns = [] }: TaskDialogProps) {
  const titleId = useId();
  const endDateRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(task?.title ?? '');
  const [workType, setWorkType] = useState(task?.workType ?? '');
  const [assignee, setAssignee] = useState(task?.assignee ?? '');
  const [comment, setComment] = useState(task?.comment ?? '');
  const [duration, setDuration] = useState(
    task?.duration === null || task?.duration === undefined
      ? ''
      : String(task.duration),
  );
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'Ожидает');
  const [color, setColor] = useState<TaskColor>(
    task?.color && isTaskColor(task.color) ? task.color : 'sage',
  );
  const [startDate, setStartDate] = useState(task?.startDate ?? '');
  const [endDate, setEndDate] = useState(task?.endDate ?? '');
  const [excludeWeekends, setExcludeWeekends] = useState(true);
  const [customFields, setCustomFields] = useState<Record<string, string>>(
    task?.customFields ?? {},
  );
  const [formError, setFormError] = useState('');
  const hasLegacyWorkType = Boolean(
    task?.workType && !TASK_WORK_TYPES.some((item) => item === task.workType),
  );

  function optionalValue(value: string) {
    const trimmed = value.trim();
    if (task) return trimmed || null;
    return trimmed || undefined;
  }

  function optionalDate(value: string) {
    if (task) return value || null;
    return value || undefined;
  }

  function syncDuration(nextStartDate: string, nextEndDate: string) {
    if (nextStartDate && nextEndDate && nextStartDate <= nextEndDate) {
      setDuration(String(
        differenceInCalendarDays(
          parseISO(nextEndDate),
          parseISO(nextStartDate),
        ) + 1,
      ));
    }
  }

  function changeStartDate(value: string) {
    setStartDate(value);
    syncDuration(value, endDate);
  }

  function changeEndDate(value: string) {
    setEndDate(value);
    syncDuration(startDate, value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (startDate && endDate && startDate > endDate) {
      setFormError('Дата окончания не может быть раньше даты начала');
      endDateRef.current?.focus();
      return;
    }
    const parsedDuration = duration ? Number(duration) : undefined;
    if (
      parsedDuration !== undefined &&
      (!Number.isInteger(parsedDuration) || parsedDuration < 1)
    ) {
      setFormError('Длительность должна быть целым числом не меньше одного дня');
      return;
    }
    if (parsedDuration !== undefined && !startDate && !endDate) {
      setFormError('Для расчёта длительности укажите начало или конец задачи');
      return;
    }
    setFormError('');
    const customKeys = new Set(
      columns.filter(({ isDefault }) => !isDefault).map(({ key }) => key),
    );
    const normalizedCustomFields = Object.entries(customFields).reduce<Record<string, string>>(
      (result, [key, value]) => {
        const trimmed = value.trim();
        if (customKeys.has(key) && trimmed) result[key] = trimmed;
        return result;
      },
      {},
    );
    onSubmit({
      title: title.trim(),
      workType: optionalValue(workType),
      assignee: assignee.trim(),
      comment: optionalValue(comment),
      status,
      color,
      ...(!datesReadOnly ? {
        startDate: optionalDate(startDate),
        endDate: optionalDate(endDate),
        duration: parsedDuration,
      } : {}),
      ...(!task ? { excludeWeekends } : {}),
      customFields: normalizedCustomFields,
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
              Обязательно только название. Длительность задаёт длину полосы в календарных днях.
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
            <SelectField disabled={isPending} label="Тип работ" onChange={(event) => setWorkType(event.target.value)} value={workType}>
              <option value="">Не выбран</option>
              {hasLegacyWorkType ? <option value={task!.workType!}>{task!.workType} (ранее выбранное)</option> : null}
              {TASK_WORK_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
            </SelectField>
            <TextField disabled={isPending} label="Ответственный" maxLength={200} onChange={(event) => setAssignee(event.target.value)} value={assignee} />
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-[var(--color-text)]" htmlFor="task-comment">
                Комментарий
              </label>
              <textarea
                className="min-h-28 w-full resize-y rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-3 text-base leading-6 text-[var(--color-text)] shadow-[var(--shadow-input)] outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-[var(--color-text-faint)] hover:border-[var(--color-border-hover)] focus:border-[var(--color-primary)] focus:ring-3 focus:ring-[var(--color-primary-ring)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-disabled)] disabled:text-[var(--color-text-faint)]"
                disabled={isPending}
                id="task-comment"
                maxLength={1000}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Дополнительная информация по задаче"
                value={comment}
              />
              <p className="mt-1.5 text-right text-xs tabular-nums text-[var(--color-text-muted)]">
                {comment.length}/1000
              </p>
            </div>
            <TextField disabled={isPending || datesReadOnly} label="Длительность, дней" min="1" onChange={(event) => setDuration(event.target.value)} placeholder="Например, 7" step="1" type="number" value={duration} />
            <SelectField disabled={isPending} label="Статус" onChange={(event) => setStatus(event.target.value as TaskStatus)} value={status}>
              {TASK_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
            </SelectField>
            <fieldset className="sm:col-span-2" disabled={isPending}>
              <legend className="mb-2 text-sm font-semibold text-[var(--color-text)]">Цвет полосы</legend>
              <div className="flex flex-wrap gap-2">
                {TASK_COLORS.map((item) => (
                  <button
                    aria-label={`Цвет: ${TASK_COLOR_NAMES[item]}`}
                    aria-pressed={color === item}
                    className="size-8 rounded-full border-2 border-white shadow-sm outline-none ring-offset-2 transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] data-[selected=true]:ring-2 data-[selected=true]:ring-[var(--color-accent)]"
                    data-selected={color === item}
                    key={item}
                    onClick={() => setColor(item)}
                    style={{ backgroundColor: `var(--color-task-${item})` }}
                    title={TASK_COLOR_NAMES[item]}
                    type="button"
                  />
                ))}
              </div>
            </fieldset>
            {columns.filter(({ isDefault }) => !isDefault).map((column) => (
              <TextField
                disabled={isPending}
                key={column.id}
                label={column.name}
                maxLength={500}
                onChange={(event) => setCustomFields((current) => ({
                  ...current,
                  [column.key]: event.target.value,
                }))}
                value={customFields[column.key] ?? ''}
              />
            ))}
            <TextField disabled={isPending || datesReadOnly} icon={<CalendarDays aria-hidden className="size-[18px]" />} label="Начало задачи" onChange={(event) => changeStartDate(event.target.value)} type="date" value={startDate} />
            <TextField disabled={isPending || datesReadOnly} error={formError || undefined} icon={<CalendarDays aria-hidden className="size-[18px]" />} label="Конец задачи" min={startDate || undefined} onChange={(event) => changeEndDate(event.target.value)} ref={endDateRef} type="date" value={endDate} />
          </div>

          {datesReadOnly ? <p className="mt-3 text-xs leading-5 text-[var(--color-text-muted)]">Даты родительской задачи рассчитываются автоматически по вложенным задачам.</p> : null}

          {!task ? (
            <label className="mt-5 flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4 text-sm">
              <input checked={excludeWeekends} className="mt-0.5 size-4 accent-[var(--color-primary)]" disabled={isPending} onChange={(event) => setExcludeWeekends(event.target.checked)} type="checkbox" />
              <span><span className="font-semibold">Не учитывать выходные дни</span><span className="mt-1 block text-xs leading-5 text-[var(--color-text-muted)]">При одной указанной дате длительность считается в рабочих днях. Если указаны обе даты, диапазон сохраняется без пересчёта.</span></span>
            </label>
          ) : null}

          {serverError ? <div className="mt-5"><Alert>{serverError}</Alert></div> : null}

          <div className={`mt-7 flex flex-col-reverse gap-3 sm:flex-row ${task && onDelete ? 'sm:justify-between' : 'sm:justify-end'}`}>
            {task && onDelete ? (
              <Button disabled={isPending} onClick={onDelete} type="button" variant="danger">
                <Trash2 aria-hidden className="size-4" />
                Удалить задачу
              </Button>
            ) : null}
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Button disabled={isPending} onClick={onClose} type="button" variant="secondary">Отмена</Button>
              <Button isLoading={isPending} loadingLabel="Сохраняем…" type="submit">{task ? 'Сохранить задачу' : 'Создать задачу'}</Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
