import { useEffect, useId, useState, type FormEvent } from 'react';
import { CalendarDays, X } from 'lucide-react';

import type { Project, ProjectInput } from './projects.api';

type ProjectDialogProps = {
  project?: Project | null;
  isPending: boolean;
  serverError?: string;
  onClose: () => void;
  onSubmit: (input: ProjectInput) => void;
};

export function ProjectDialog({ project, isPending, serverError, onClose, onSubmit }: ProjectDialogProps) {
  const titleId = useId();
  const [name, setName] = useState(project?.name ?? '');
  const [startDate, setStartDate] = useState(project?.startDate ?? '');
  const [endDate, setEndDate] = useState(project?.endDate ?? '');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isPending, onClose]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (startDate > endDate) {
      setFormError('Дата окончания не может быть раньше даты начала');
      return;
    }
    setFormError('');
    onSubmit({ name: name.trim(), startDate, endDate });
  }

  const error = formError || serverError;

  return (
    <div aria-labelledby={titleId} aria-modal="true" className="fixed inset-0 z-50 grid items-end bg-[#17221e]/45 p-0 backdrop-blur-[2px] sm:place-items-center sm:p-6" role="dialog">
      <div className="w-full rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-xl">
        <div className="flex items-start justify-between border-b border-[#e1e6e3] px-5 py-5 sm:px-7">
          <div>
            <h2 className="text-xl font-semibold text-[#18231f]" id={titleId}>{project ? 'Редактировать проект' : 'Новый проект'}</h2>
            <p className="mt-1 text-sm text-[#66756e]">Период задаёт границы будущей временной шкалы.</p>
          </div>
          <button aria-label="Закрыть" className="grid size-11 shrink-0 place-items-center rounded-md text-[#607069] hover:bg-[#f0f3f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286b59] disabled:opacity-50" disabled={isPending} onClick={onClose} type="button">
            <X aria-hidden className="size-5" />
          </button>
        </div>

        <form className="px-5 py-6 sm:px-7" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-[#26342f]" htmlFor="project-name">Название</label>
          <input autoFocus className="mt-2 h-11 w-full rounded-md border border-[#cbd5d0] bg-white px-3 text-[#18231f] outline-none placeholder:text-[#98a49f] focus:border-[#286b59] focus:ring-2 focus:ring-[#286b59]/15" disabled={isPending} id="project-name" maxLength={120} onChange={(event) => setName(event.target.value)} placeholder="Например, Запуск нового продукта" required value={name} />

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-[#26342f]">
              Дата начала
              <span className="relative mt-2 block">
                <CalendarDays aria-hidden className="pointer-events-none absolute left-3 top-3 size-5 text-[#71817a]" />
                <input className="h-11 w-full rounded-md border border-[#cbd5d0] bg-white pl-10 pr-3 outline-none focus:border-[#286b59] focus:ring-2 focus:ring-[#286b59]/15" disabled={isPending} onChange={(event) => setStartDate(event.target.value)} required type="date" value={startDate} />
              </span>
            </label>
            <label className="block text-sm font-medium text-[#26342f]">
              Дата окончания
              <span className="relative mt-2 block">
                <CalendarDays aria-hidden className="pointer-events-none absolute left-3 top-3 size-5 text-[#71817a]" />
                <input className="h-11 w-full rounded-md border border-[#cbd5d0] bg-white pl-10 pr-3 outline-none focus:border-[#286b59] focus:ring-2 focus:ring-[#286b59]/15" disabled={isPending} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} required type="date" value={endDate} />
              </span>
            </label>
          </div>

          {error ? <p className="mt-4 rounded-md bg-[#fff1ef] px-3 py-2 text-sm text-[#a33a2b]" role="alert">{error}</p> : null}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button className="h-11 rounded-md border border-[#cbd5d0] px-4 text-sm font-semibold text-[#42514b] hover:bg-[#f3f5f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286b59] disabled:opacity-50" disabled={isPending} onClick={onClose} type="button">Отмена</button>
            <button className="h-11 rounded-md bg-[#286b59] px-5 text-sm font-semibold text-white hover:bg-[#215949] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286b59] disabled:cursor-wait disabled:opacity-60" disabled={isPending} type="submit">
              {isPending ? 'Сохраняем…' : project ? 'Сохранить' : 'Создать проект'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
