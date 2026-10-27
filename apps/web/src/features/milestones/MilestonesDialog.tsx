import { CalendarDays, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';

import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TextField } from '../../components/ui/TextField';
import {
  MILESTONE_COLORS,
  type Milestone,
  type MilestoneColor,
  type MilestoneInput,
} from './milestones.api';

const COLOR_NAMES: Record<MilestoneColor, string> = {
  sage: 'Шалфей', blue: 'Синий', sky: 'Небесный', lavender: 'Лавандовый',
  plum: 'Сливовый', rose: 'Розовый', coral: 'Коралловый', sand: 'Песочный',
  amber: 'Янтарный', teal: 'Бирюзовый',
};

type Props = {
  milestones: Milestone[];
  projectStartDate: string;
  projectEndDate: string;
  isPending: boolean;
  serverError?: string;
  onClose: () => void;
  onSave: (input: MilestoneInput, milestoneId?: string) => void;
  onDelete: (milestoneId: string) => void;
};

export function MilestonesDialog({
  milestones,
  projectStartDate,
  projectEndDate,
  isPending,
  serverError,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const titleId = useId();
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(projectStartDate);
  const [color, setColor] = useState<MilestoneColor>('coral');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  function resetForm() {
    setEditing(null);
    setTitle('');
    setDate(projectStartDate);
    setColor('coral');
    setFormError('');
  }

  function startEditing(milestone: Milestone) {
    setEditing(milestone);
    setTitle(milestone.title);
    setDate(milestone.date);
    setColor(milestone.color);
    setFormError('');
    setDeletingId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setFormError('Укажите название вехи');
      return;
    }
    if (date < projectStartDate || date > projectEndDate) {
      setFormError('Дата вехи должна входить в период проекта');
      return;
    }
    setFormError('');
    onSave({ title: title.trim(), date, color }, editing?.id);
  }

  return (
    <Modal isDismissible={!isPending} labelledBy={titleId} onClose={onClose}>
      <div className="ds-dialog-panel">
        <div className="flex items-start justify-between gap-5 border-b border-[var(--color-border)] px-5 py-5 sm:px-7">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em]" id={titleId}>Вехи проекта</h2>
            <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-muted)]">Контрольные даты отображаются вертикальными линиями на всей шкале.</p>
          </div>
          <Button aria-label="Закрыть" disabled={isPending} onClick={onClose} size="icon" type="button" variant="ghost"><X aria-hidden className="size-5" /></Button>
        </div>

        <div className="max-h-[72vh] overflow-y-auto px-5 py-5 sm:px-7">
          {milestones.length > 0 ? <div className="mb-5 space-y-2" aria-label="Созданные вехи">
            {milestones.map((milestone) => (
              <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-white p-3" key={milestone.id}>
                <span aria-hidden className="size-3 shrink-0 rounded-full border-2 border-white shadow-sm" data-milestone-color={milestone.color} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{milestone.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--color-text-muted)]"><CalendarDays aria-hidden className="size-3.5" />{milestone.date}</p>
                </div>
                {deletingId === milestone.id ? <div className="flex items-center gap-1">
                  <Button className="h-8 px-2 text-xs" disabled={isPending} onClick={() => setDeletingId(null)} type="button" variant="ghost">Нет</Button>
                  <Button className="h-8 px-2 text-xs" disabled={isPending} onClick={() => onDelete(milestone.id)} type="button" variant="danger">Удалить</Button>
                </div> : <>
                  <Button aria-label={`Редактировать ${milestone.title}`} disabled={isPending} onClick={() => startEditing(milestone)} size="icon" type="button" variant="ghost"><Pencil aria-hidden className="size-4" /></Button>
                  <Button aria-label={`Удалить ${milestone.title}`} disabled={isPending} onClick={() => setDeletingId(milestone.id)} size="icon" type="button" variant="ghost"><Trash2 aria-hidden className="size-4" /></Button>
                </>}
              </div>
            ))}
          </div> : <div className="mb-5 rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-subtle)] px-4 py-5 text-center text-sm text-[var(--color-text-muted)]">В проекте пока нет вех</div>}

          <form className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4" onSubmit={handleSubmit}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">{editing ? 'Редактировать веху' : 'Новая веха'}</h3>
              {editing ? <button className="text-xs font-semibold text-[var(--color-accent)]" disabled={isPending} onClick={resetForm} type="button"><Plus aria-hidden className="mr-1 inline size-3.5" />Новая</button> : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><TextField disabled={isPending} label="Название" maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="Например, Релиз" value={title} /></div>
              <TextField disabled={isPending} icon={<CalendarDays aria-hidden className="size-[18px]" />} label="Дата" max={projectEndDate} min={projectStartDate} onChange={(event) => setDate(event.target.value)} required type="date" value={date} />
              <fieldset disabled={isPending}>
                <legend className="mb-2 text-sm font-medium">Цвет</legend>
                <div className="flex flex-wrap gap-1.5">
                  {MILESTONE_COLORS.map((item) => <button aria-label={COLOR_NAMES[item]} aria-pressed={color === item} className="size-7 rounded-full border-2 border-white shadow-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] data-[selected=true]:ring-2 data-[selected=true]:ring-[var(--color-accent)]" data-milestone-color={item} data-selected={color === item} key={item} onClick={() => setColor(item)} title={COLOR_NAMES[item]} type="button" />)}
                </div>
              </fieldset>
            </div>
            {formError || serverError ? <div className="mt-4"><Alert>{formError || serverError}</Alert></div> : null}
            <div className="mt-5 flex justify-end"><Button isLoading={isPending} loadingLabel="Сохраняем…" type="submit">{editing ? 'Сохранить веху' : 'Добавить веху'}</Button></div>
          </form>
        </div>
      </div>
    </Modal>
  );
}
