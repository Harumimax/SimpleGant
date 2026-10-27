import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';

import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import type {
  ProjectColumn,
  ProjectColumnConfigurationInput,
} from './projects.api';

type ColumnDraft = {
  clientId: string;
  id?: string;
  name: string;
  isVisible: boolean;
  isDefault: boolean;
};

type Props = {
  columns: ProjectColumn[];
  isPending: boolean;
  serverError?: string;
  onClose: () => void;
  onSubmit: (columns: ProjectColumnConfigurationInput[]) => void;
};

function toDraft(column: ProjectColumn): ColumnDraft {
  return { ...column, clientId: column.id };
}

export function ProjectColumnsDialog({
  columns,
  isPending,
  serverError,
  onClose,
  onSubmit,
}: Props) {
  const titleId = useId();
  const [drafts, setDrafts] = useState<ColumnDraft[]>(() =>
    [...columns].sort((left, right) => left.orderIndex - right.orderIndex).map(toDraft),
  );
  const [formError, setFormError] = useState('');

  function update(clientId: string, patch: Partial<ColumnDraft>) {
    setDrafts((current) =>
      current.map((column) =>
        column.clientId === clientId ? { ...column, ...patch } : column,
      ),
    );
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= drafts.length) return;
    setDrafts((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  function addColumn() {
    if (drafts.length >= 10) return;
    setDrafts((current) => [
      ...current,
      {
        clientId: `new-${crypto.randomUUID()}`,
        name: `Новая колонка ${current.length - 4}`,
        isVisible: true,
        isDefault: false,
      },
    ]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const names = drafts.map(({ name }) => name.trim());
    if (names.some((name) => !name)) {
      setFormError('У каждой колонки должно быть название');
      return;
    }
    if (new Set(names.map((name) => name.toLocaleLowerCase('ru'))).size !== names.length) {
      setFormError('Названия колонок не должны повторяться');
      return;
    }
    setFormError('');
    onSubmit(drafts.map(({ id, name, isVisible }) => ({
      ...(id ? { id } : {}),
      name: name.trim(),
      isVisible,
    })));
  }

  return (
    <Modal isDismissible={!isPending} labelledBy={titleId} onClose={onClose}>
      <div className="ds-dialog-panel">
        <div className="flex items-start justify-between gap-5 border-b border-[var(--color-border)] px-5 py-5 sm:px-7">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em]" id={titleId}>
              Настроить колонки
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-muted)]">
              Переименуйте, расположите и выберите видимые поля. Максимум — 10 колонок.
            </p>
          </div>
          <Button aria-label="Закрыть" disabled={isPending} onClick={onClose} size="icon" type="button" variant="ghost">
            <X aria-hidden className="size-5" />
          </Button>
        </div>

        <form className="px-5 py-5 sm:px-7" onSubmit={handleSubmit}>
          <div className="space-y-2" role="list">
            {drafts.map((column, index) => (
              <div className="grid grid-cols-[56px_minmax(0,1fr)_36px_36px] items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white p-2" key={column.clientId} role="listitem">
                <div className="flex">
                  <button aria-label={`Поднять колонку ${column.name}`} className="grid size-7 place-items-center rounded text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] disabled:opacity-25" disabled={isPending || index === 0} onClick={() => move(index, -1)} type="button">
                    <ArrowUp aria-hidden className="size-3.5" />
                  </button>
                  <button aria-label={`Опустить колонку ${column.name}`} className="grid size-7 place-items-center rounded text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] disabled:opacity-25" disabled={isPending || index === drafts.length - 1} onClick={() => move(index, 1)} type="button">
                    <ArrowDown aria-hidden className="size-3.5" />
                  </button>
                </div>
                <label className="min-w-0">
                  <span className="sr-only">Название колонки</span>
                  <input aria-label={`Название колонки ${index + 1}`} className="h-9 w-full rounded-md border border-[var(--color-border-strong)] bg-white px-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-focus)]" disabled={isPending} maxLength={80} onChange={(event) => update(column.clientId, { name: event.target.value })} value={column.name} />
                </label>
                <button aria-label={`${column.isVisible ? 'Скрыть' : 'Показать'} колонку ${column.name}`} aria-pressed={column.isVisible} className="grid size-9 place-items-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)]" disabled={isPending} onClick={() => update(column.clientId, { isVisible: !column.isVisible })} title={column.isVisible ? 'Колонка видна' : 'Колонка скрыта'} type="button">
                  {column.isVisible ? <Eye aria-hidden className="size-4" /> : <EyeOff aria-hidden className="size-4" />}
                </button>
                <button aria-label={`Удалить колонку ${column.name}`} className="grid size-9 place-items-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)] disabled:opacity-25" disabled={isPending || column.isDefault} onClick={() => setDrafts((current) => current.filter(({ clientId }) => clientId !== column.clientId))} title={column.isDefault ? 'Системную колонку нельзя удалить' : 'Удалить колонку'} type="button">
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </div>
            ))}
          </div>

          <button className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-dashed border-[var(--color-border-strong)] text-sm font-semibold text-[var(--color-accent)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] disabled:cursor-not-allowed disabled:opacity-50" disabled={isPending || drafts.length >= 10} onClick={addColumn} type="button">
            <Plus aria-hidden className="size-4" />
            {drafts.length >= 10 ? 'Достигнут лимит 10 колонок' : 'Добавить колонку'}
          </button>

          {formError || serverError ? <div className="mt-4"><Alert>{formError || serverError}</Alert></div> : null}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">Колонок: {drafts.length} из 10</span>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Button disabled={isPending} onClick={onClose} type="button" variant="secondary">Отмена</Button>
              <Button isLoading={isPending} loadingLabel="Сохраняем…" type="submit">Сохранить колонки</Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
