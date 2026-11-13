import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';

type Props = {
  columnName: string;
  minWidth: number;
  onReset: () => void;
  onResize: (width: number) => void;
};

type ResizeSession = {
  pointerId: number;
  startWidth: number;
  startX: number;
  previousCursor: string;
  previousUserSelect: string;
};

const MAX_COLUMN_WIDTH = 720;

function clampWidth(width: number, minimum: number) {
  return Math.min(Math.max(Math.round(width), minimum), MAX_COLUMN_WIDTH);
}

export function ColumnResizeHandle({
  columnName,
  minWidth,
  onReset,
  onResize,
}: Props) {
  const sessionRef = useRef<ResizeSession | null>(null);

  function finishResize() {
    const session = sessionRef.current;
    if (!session) return;
    document.body.style.cursor = session.previousCursor;
    document.body.style.userSelect = session.previousUserSelect;
    sessionRef.current = null;
  }

  useEffect(() => () => {
    const session = sessionRef.current;
    if (!session) return;
    document.body.style.cursor = session.previousCursor;
    document.body.style.userSelect = session.previousUserSelect;
  }, []);

  function startResize(event: PointerEvent<HTMLButtonElement>) {
    const header = event.currentTarget.parentElement;
    if (!header) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    sessionRef.current = {
      pointerId: event.pointerId,
      startWidth: header.getBoundingClientRect().width,
      startX: event.clientX,
      previousCursor: document.body.style.cursor,
      previousUserSelect: document.body.style.userSelect,
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  function resize(event: PointerEvent<HTMLButtonElement>) {
    const session = sessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    onResize(clampWidth(
      session.startWidth + event.clientX - session.startX,
      minWidth,
    ));
  }

  function stopResize(event: PointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    finishResize();
  }

  function resizeWithKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const header = event.currentTarget.parentElement;
    if (!header) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const step = event.shiftKey ? 32 : 16;
    onResize(clampWidth(
      header.getBoundingClientRect().width + direction * step,
      minWidth,
    ));
  }

  return (
    <button
      aria-label={`Изменить ширину колонки ${columnName}`}
      className="group absolute inset-y-0 -right-1 z-10 w-2 touch-none cursor-col-resize select-none outline-none"
      onDoubleClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onReset();
      }}
      onKeyDown={resizeWithKeyboard}
      onLostPointerCapture={finishResize}
      onPointerCancel={stopResize}
      onPointerDown={startResize}
      onPointerMove={resize}
      onPointerUp={stopResize}
      title="Потяните для изменения ширины. Двойной щелчок — сбросить"
      type="button"
    >
      <span className="absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover:bg-[var(--color-primary)] group-focus-visible:bg-[var(--color-primary)] group-active:bg-[var(--color-primary)]" />
    </button>
  );
}
