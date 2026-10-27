import { AlertTriangle, X } from 'lucide-react';

import type { Project } from './projects.api';

type Props = {
  project: Project;
  isPending: boolean;
  serverError?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteProjectDialog({ project, isPending, serverError, onClose, onConfirm }: Props) {
  return (
    <div aria-labelledby="delete-project-title" aria-modal="true" className="fixed inset-0 z-50 grid items-end bg-[#17221e]/45 p-0 backdrop-blur-[2px] sm:place-items-center sm:p-6" role="alertdialog">
      <div className="w-full rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[#fff0ed] text-[#b33a2b]"><AlertTriangle aria-hidden className="size-5" /></div>
          <button aria-label="Закрыть" className="grid size-11 shrink-0 place-items-center rounded-md text-[#607069] hover:bg-[#f0f3f1] disabled:opacity-50" disabled={isPending} onClick={onClose} type="button"><X aria-hidden className="size-5" /></button>
        </div>
        <h2 className="mt-4 text-xl font-semibold text-[#18231f]" id="delete-project-title">Удалить проект?</h2>
        <p className="mt-2 text-sm leading-6 text-[#607069]">«{project.name}» будет удалён без возможности восстановления. Вместе с ним удалятся все данные диаграммы.</p>
        {serverError ? <p className="mt-4 rounded-md bg-[#fff1ef] px-3 py-2 text-sm text-[#a33a2b]" role="alert">{serverError}</p> : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button className="h-11 rounded-md border border-[#cbd5d0] px-4 text-sm font-semibold text-[#42514b] hover:bg-[#f3f5f4] disabled:opacity-50" disabled={isPending} onClick={onClose} type="button">Отмена</button>
          <button className="h-11 rounded-md bg-[#b33a2b] px-5 text-sm font-semibold text-white hover:bg-[#922f23] disabled:cursor-wait disabled:opacity-60" disabled={isPending} onClick={onConfirm} type="button">{isPending ? 'Удаляем…' : 'Удалить проект'}</button>
        </div>
      </div>
    </div>
  );
}
