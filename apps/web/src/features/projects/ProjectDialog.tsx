import { CalendarDays, X } from 'lucide-react';
import { useId, useRef, useState, type FormEvent } from 'react';

import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TextField } from '../../components/ui/TextField';
import type { Project, ProjectInput } from './projects.api';

type ProjectDialogProps = {
  project?: Project | null;
  isPending: boolean;
  serverError?: string;
  onClose: () => void;
  onSubmit: (input: ProjectInput) => void;
};

export function ProjectDialog({
  project,
  isPending,
  serverError,
  onClose,
  onSubmit,
}: ProjectDialogProps) {
  const titleId = useId();
  const endDateRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(project?.name ?? '');
  const [startDate, setStartDate] = useState(project?.startDate ?? '');
  const [endDate, setEndDate] = useState(project?.endDate ?? '');
  const [formError, setFormError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (startDate > endDate) {
      setFormError('Дата окончания не может быть раньше даты начала');
      endDateRef.current?.focus();
      return;
    }
    setFormError('');
    onSubmit({ name: name.trim(), startDate, endDate });
  }

  return (
    <Modal
      isDismissible={!isPending}
      labelledBy={titleId}
      onClose={onClose}
    >
      <div className="ds-dialog-panel">
        <div className="flex items-start justify-between gap-5 border-b border-[var(--color-border)] px-5 py-5 sm:px-7">
          <div className="min-w-0">
            <h2
              className="text-xl font-semibold tracking-[-0.02em] text-[var(--color-text)] text-balance"
              id={titleId}
            >
              {project ? 'Редактировать проект' : 'Новый проект'}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-muted)] text-pretty">
              Период проекта задаёт границы временной шкалы.
            </p>
          </div>
          <Button
            aria-label="Закрыть"
            disabled={isPending}
            onClick={onClose}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X aria-hidden className="size-5" />
          </Button>
        </div>

        <form className="px-5 py-6 sm:px-7" onSubmit={handleSubmit}>
          <TextField
            autoComplete="off"
            autoFocus
            disabled={isPending}
            id="project-name"
            label="Название"
            maxLength={120}
            name="project-name"
            onChange={(event) => setName(event.target.value)}
            placeholder="Например, запуск нового продукта…"
            required
            value={name}
          />

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <TextField
              autoComplete="off"
              disabled={isPending}
              icon={<CalendarDays aria-hidden className="size-[18px]" />}
              label="Дата начала"
              name="project-start-date"
              onChange={(event) => setStartDate(event.target.value)}
              required
              type="date"
              value={startDate}
            />
            <TextField
              autoComplete="off"
              disabled={isPending}
              error={formError || undefined}
              icon={<CalendarDays aria-hidden className="size-[18px]" />}
              label="Дата окончания"
              min={startDate || undefined}
              name="project-end-date"
              onChange={(event) => setEndDate(event.target.value)}
              required
              ref={endDateRef}
              type="date"
              value={endDate}
            />
          </div>

          {serverError ? (
            <div className="mt-5">
              <Alert>{serverError}</Alert>
            </div>
          ) : null}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              disabled={isPending}
              onClick={onClose}
              type="button"
              variant="secondary"
            >
              Отмена
            </Button>
            <Button
              isLoading={isPending}
              loadingLabel="Сохраняем…"
              type="submit"
            >
              {project ? 'Сохранить изменения' : 'Создать проект'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
