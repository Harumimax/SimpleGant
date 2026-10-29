import { addDays, format, parseISO } from 'date-fns';
import { CalendarDays, Plus, Trash2, X } from 'lucide-react';
import { useId, useRef, useState, type FormEvent } from 'react';

import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { SelectField } from '../../components/ui/SelectField';
import { TextField } from '../../components/ui/TextField';
import type { ProjectColumn } from '../projects/projects.api';
import type { NonWorkingDay } from '../calendar/non-working-days.api';
import { calculateTaskDuration } from '../gantt/timeline';
import { periodsOverlap } from '../gantt/taskPeriods';
import {
  isTaskColor,
  TASK_COLORS,
  TASK_STATUSES,
  TASK_WORK_TYPES,
  type Task,
  type TaskColor,
  type TaskInput,
  type TaskPeriod,
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
  excludeNonWorkingDays?: boolean;
  nonWorkingDays?: NonWorkingDay[];
};

export function TaskDialog({
  task,
  isPending,
  serverError,
  onClose,
  onDelete,
  onSubmit,
  datesReadOnly = false,
  columns = [],
  excludeNonWorkingDays = true,
  nonWorkingDays = [],
}: TaskDialogProps) {
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
  const [includeInDuration, setIncludeInDuration] = useState(
    task?.includeInDuration ?? true,
  );
  const [periods, setPeriods] = useState<TaskPeriod[]>(task?.periods ?? []);
  const [startDate, setStartDate] = useState(task?.startDate ?? '');
  const [endDate, setEndDate] = useState(task?.endDate ?? '');
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
      setDuration(String(calculateTaskDuration(
        nextStartDate,
        nextEndDate,
        excludeNonWorkingDays,
        nonWorkingDays,
      ) ?? ''));
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

  function defaultPeriodEnd(value: string) {
    return value ? format(addDays(parseISO(value), 6), 'yyyy-MM-dd') : '';
  }

  function addPeriod() {
    if (periods.length >= 4) return;
    const periodStart = endDate
      ? format(addDays(parseISO(endDate), 1), 'yyyy-MM-dd')
      : '';
    setPeriods((current) => [...current, {
      id: crypto.randomUUID(),
      title: '',
      startDate: periodStart,
      endDate: defaultPeriodEnd(periodStart),
      includeInDuration: true,
      color,
    }]);
  }

  function updatePeriod(periodId: string, patch: Partial<TaskPeriod>) {
    setPeriods((current) => current.map((period) =>
      period.id === periodId ? { ...period, ...patch } : period,
    ));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (startDate && endDate && startDate > endDate) {
      setFormError('Дата окончания не может быть раньше даты начала');
      endDateRef.current?.focus();
      return;
    }
    const parsedDuration = duration ? Number(duration) : undefined;
    const hasExplicitRange = Boolean(startDate && endDate);
    if (
      !hasExplicitRange &&
      parsedDuration !== undefined &&
      (!Number.isInteger(parsedDuration) || parsedDuration < 1)
    ) {
      setFormError('Длительность должна быть целым числом не меньше одного дня');
      return;
    }
    if (!hasExplicitRange && parsedDuration !== undefined && !startDate && !endDate) {
      setFormError('Для расчёта длительности укажите начало или конец задачи');
      return;
    }
    if (periods.length > 0 && (!startDate || !endDate)) {
      setFormError('Для дополнительных периодов укажите обе даты основного периода');
      return;
    }
    const normalizedPeriods = periods.map((period) => ({
      ...period,
      title: period.title.trim(),
      endDate: period.endDate || defaultPeriodEnd(period.startDate),
    }));
    if (normalizedPeriods.some((period) => !period.title || !period.startDate)) {
      setFormError('Укажите название и дату начала каждого периода');
      return;
    }
    if (normalizedPeriods.some((period) => period.endDate < period.startDate)) {
      setFormError('Дата окончания периода не может быть раньше даты начала');
      return;
    }
    const primaryPeriod = startDate && endDate ? [{
      id: task?.id ?? 'primary',
      title: title.trim(),
      startDate,
      endDate,
      includeInDuration,
      color,
    }] : [];
    if (periodsOverlap([...primaryPeriod, ...normalizedPeriods])) {
      setFormError('Периоды одной задачи не должны пересекаться');
      return;
    }
    if ([...primaryPeriod, ...normalizedPeriods].length > 0
      && ![...primaryPeriod, ...normalizedPeriods].some((period) => period.includeInDuration)) {
      setFormError('Хотя бы один период должен учитываться в общей длительности');
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
      includeInDuration,
      periods: normalizedPeriods,
      ...(!datesReadOnly ? {
        startDate: optionalDate(startDate),
        endDate: optionalDate(endDate),
        duration: hasExplicitRange ? undefined : parsedDuration,
      } : {}),
      customFields: normalizedCustomFields,
    });
  }

  const calculatedDuration = startDate && endDate
    ? (includeInDuration ? calculateTaskDuration(
        startDate,
        endDate,
        excludeNonWorkingDays,
        nonWorkingDays,
      ) ?? 0 : 0) + periods.reduce((total, period) => {
        if (!period.includeInDuration || !period.startDate) return total;
        const periodEnd = period.endDate || defaultPeriodEnd(period.startDate);
        return total + (calculateTaskDuration(
          period.startDate,
          periodEnd,
          excludeNonWorkingDays,
          nonWorkingDays,
        ) ?? 0);
      }, 0)
    : null;

  return (
    <Modal isDismissible={!isPending} labelledBy={titleId} onClose={onClose}>
      <div className="ds-dialog-panel">
        <div className="flex items-start justify-between gap-5 border-b border-[var(--color-border)] px-5 py-5 sm:px-7">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em]" id={titleId}>
              {task ? 'Редактировать задачу' : 'Новая задача'}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-muted)]">
              Обязательно только название. Длительность рассчитывается по календарю проекта.
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
            <TextField disabled={isPending || datesReadOnly || Boolean(startDate && endDate)} label="Длительность, дней" min={startDate && endDate ? '0' : '1'} onChange={(event) => setDuration(event.target.value)} placeholder="Например, 7" step="1" type="number" value={calculatedDuration === null ? duration : String(calculatedDuration)} />
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
            <label className="sm:col-span-2 flex items-center gap-3 text-sm font-medium text-[var(--color-text)]">
              <input
                checked={includeInDuration}
                className="size-4 accent-[var(--color-primary)]"
                disabled={isPending || datesReadOnly}
                onChange={(event) => setIncludeInDuration(event.target.checked)}
                type="checkbox"
              />
              Учитывать основной период в общей длительности
            </label>
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

          {!datesReadOnly ? (
            <section className="mt-7 border-t border-[var(--color-border)] pt-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">Дополнительные периоды</h3>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">До четырёх дополнительных полос в строке задачи.</p>
                </div>
                <Button disabled={isPending || periods.length >= 4} onClick={addPeriod} type="button" variant="secondary">
                  <Plus aria-hidden className="size-4" />
                  Период
                </Button>
              </div>

              <div className="mt-4 space-y-4">
                {periods.map((period, index) => (
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4" key={period.id}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">Период {index + 2}</span>
                      <Button aria-label={`Удалить период ${index + 2}`} disabled={isPending} onClick={() => setPeriods((current) => current.filter(({ id }) => id !== period.id))} size="icon" type="button" variant="ghost">
                        <Trash2 aria-hidden className="size-4" />
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <TextField disabled={isPending} label="Название периода" maxLength={200} onChange={(event) => updatePeriod(period.id, { title: event.target.value })} required value={period.title} />
                      </div>
                      <TextField disabled={isPending} icon={<CalendarDays aria-hidden className="size-[18px]" />} label="Дата начала" onChange={(event) => {
                        const nextStart = event.target.value;
                        updatePeriod(period.id, {
                          startDate: nextStart,
                          endDate: period.endDate || defaultPeriodEnd(nextStart),
                        });
                      }} required type="date" value={period.startDate} />
                      <TextField disabled={isPending} icon={<CalendarDays aria-hidden className="size-[18px]" />} label="Дата окончания" min={period.startDate || undefined} onChange={(event) => updatePeriod(period.id, { endDate: event.target.value })} type="date" value={period.endDate} />
                      <label className="sm:col-span-2 flex items-center gap-3 text-sm font-medium">
                        <input checked={period.includeInDuration} className="size-4 accent-[var(--color-primary)]" disabled={isPending} onChange={(event) => updatePeriod(period.id, { includeInDuration: event.target.checked })} type="checkbox" />
                        Учитывать в общей длительности
                      </label>
                      <fieldset className="sm:col-span-2" disabled={isPending}>
                        <legend className="mb-2 text-sm font-semibold">Цвет периода</legend>
                        <div className="flex flex-wrap gap-2">
                          {TASK_COLORS.map((item) => (
                            <button
                              aria-label={`Период ${index + 2}, цвет: ${TASK_COLOR_NAMES[item]}`}
                              aria-pressed={period.color === item}
                              className="size-7 rounded-full border-2 border-white shadow-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] data-[selected=true]:ring-2 data-[selected=true]:ring-[var(--color-accent)]"
                              data-selected={period.color === item}
                              key={item}
                              onClick={() => updatePeriod(period.id, { color: item })}
                              style={{ backgroundColor: `var(--color-task-${item})` }}
                              title={TASK_COLOR_NAMES[item]}
                              type="button"
                            />
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {datesReadOnly ? <p className="mt-3 text-xs leading-5 text-[var(--color-text-muted)]">Даты родительской задачи рассчитываются автоматически по вложенным задачам.</p> : null}

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
