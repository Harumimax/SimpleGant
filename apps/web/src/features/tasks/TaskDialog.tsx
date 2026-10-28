import { CalendarDays, X } from 'lucide-react';
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
  onSubmit: (input: TaskInput) => void;
  datesReadOnly?: boolean;
  columns?: ProjectColumn[];
};

export function TaskDialog({ task, isPending, serverError, onClose, onSubmit, datesReadOnly = false, columns = [] }: TaskDialogProps) {
  const titleId = useId();
  const endDateRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(task?.title ?? '');
  const [workType, setWorkType] = useState(task?.workType ?? '');
  const [assignee, setAssignee] = useState(task?.assignee ?? '');
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
              Название и ответственный обязательны. Длительность задаёт длину полосы в календарных днях.
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
            <TextField disabled={isPending} label="Ответственный" maxLength={200} onChange={(event) => setAssignee(event.target.value)} required value={assignee} />
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
              <span><span className="font-semibold">Не учитывать выходные дни</span><span className="mt-1 block text-xs leading-5 text-[var(--color-text-muted)]">Применяется к длительности по умолчанию, когда заполнена одна дата и длительность не указана.</span></span>
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
