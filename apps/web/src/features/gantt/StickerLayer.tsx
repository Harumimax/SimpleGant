import { GripHorizontal, Maximize2, Trash2 } from 'lucide-react';
import { useState, type PointerEvent as ReactPointerEvent } from 'react';

import {
  STICKER_COLORS,
  type Sticker,
  type StickerColor,
  type StickerUpdate,
} from '../stickers/stickers.api';

export const DEFAULT_STICKER_SIZE = 160;
export const MIN_STICKER_SIZE = 120;
export const MAX_STICKER_SIZE = 320;
export const MAX_PROJECT_STICKERS = 50;

const COLOR_LABELS: Record<StickerColor, string> = {
  amber: 'Жёлтый',
  sky: 'Голубой',
  sage: 'Зелёный',
  rose: 'Розовый',
  lavender: 'Сиреневый',
  sand: 'Бежевый',
};

type Point = { left: number; top: number };

type Props = {
  stickers: Sticker[];
  dayWidth: number;
  rowHeight: number;
  timelineWidth: number;
  canvasHeight: number;
  isPlacing?: boolean;
  readOnly?: boolean;
  onPlace?: (xDayOffset: number, yRowOffset: number) => void;
  onUpdate?: (id: string, update: StickerUpdate) => void;
  onDelete?: (id: string) => void;
  onActivate?: (id: string) => void;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

function stickerFontSize(size: number) {
  return 13 + ((size - MIN_STICKER_SIZE) / (MAX_STICKER_SIZE - MIN_STICKER_SIZE)) * 9;
}

function StickerCard({
  sticker,
  dayWidth,
  rowHeight,
  timelineWidth,
  canvasHeight,
  readOnly,
  onUpdate,
  onDelete,
  onActivate,
}: Omit<Props, 'stickers' | 'isPlacing' | 'onPlace'> & { sticker: Sticker }) {
  const initialPoint = {
    left: sticker.xDayOffset * dayWidth,
    top: sticker.yRowOffset * rowHeight,
  };
  const [previewPoint, setPreviewPoint] = useState<Point | null>(null);
  const [previewSize, setPreviewSize] = useState<number | null>(null);
  const point = previewPoint ?? initialPoint;
  const size = previewSize ?? sticker.size;

  function startMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (readOnly) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    onActivate?.(sticker.id);
    const startX = event.clientX;
    const startY = event.clientY;
    const startPoint = initialPoint;
    const activeCanvasHeight = event.currentTarget.closest('[aria-label="Стикеры проекта"]')?.clientHeight
      ?? canvasHeight;

    const move = (moveEvent: PointerEvent) => {
      setPreviewPoint({
        left: clamp(startPoint.left + moveEvent.clientX - startX, 0, timelineWidth - dayWidth),
        top: clamp(startPoint.top + moveEvent.clientY - startY, 0, activeCanvasHeight - sticker.size),
      });
    };
    const finish = (upEvent: PointerEvent) => {
      const nextPoint = {
        left: clamp(startPoint.left + upEvent.clientX - startX, 0, timelineWidth - dayWidth),
        top: clamp(startPoint.top + upEvent.clientY - startY, 0, activeCanvasHeight - sticker.size),
      };
      setPreviewPoint(null);
      onUpdate?.(sticker.id, {
        xDayOffset: Number((nextPoint.left / dayWidth).toFixed(4)),
        yRowOffset: Number((nextPoint.top / rowHeight).toFixed(4)),
      });
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', cancel);
    };
    const cancel = () => {
      setPreviewPoint(null);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', cancel);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', cancel);
  }

  function startResize(event: ReactPointerEvent<HTMLButtonElement>) {
    if (readOnly) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    onActivate?.(sticker.id);
    const startX = event.clientX;
    const startY = event.clientY;
    const activeCanvasHeight = event.currentTarget.closest('[aria-label="Стикеры проекта"]')?.clientHeight
      ?? canvasHeight;
    const maximumSize = Math.max(
      MIN_STICKER_SIZE,
      Math.min(MAX_STICKER_SIZE, activeCanvasHeight - point.top),
    );

    const sizeFor = (clientX: number, clientY: number) => clamp(
      sticker.size + Math.max(clientX - startX, clientY - startY),
      MIN_STICKER_SIZE,
      maximumSize,
    );
    const move = (moveEvent: PointerEvent) => setPreviewSize(sizeFor(moveEvent.clientX, moveEvent.clientY));
    const finish = (upEvent: PointerEvent) => {
      const nextSize = Math.round(sizeFor(upEvent.clientX, upEvent.clientY));
      setPreviewSize(null);
      onUpdate?.(sticker.id, { size: nextSize });
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', cancel);
    };
    const cancel = () => {
      setPreviewSize(null);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', cancel);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', cancel);
  }

  return (
    <article
      aria-label={`Стикер: ${sticker.text}`}
      className="gantt-sticker absolute flex flex-col overflow-hidden rounded-sm border shadow-md"
      data-color={sticker.color}
      onPointerDown={() => onActivate?.(sticker.id)}
      style={{
        height: size,
        left: point.left,
        pointerEvents: 'auto',
        top: point.top,
        width: size,
        zIndex: 40 + sticker.zIndex,
      }}
    >
      {readOnly ? (
        <p
          className="whitespace-pre-wrap break-words p-4 leading-snug"
          style={{ fontSize: stickerFontSize(size) }}
        >
          {sticker.text}
        </p>
      ) : (
        <>
          <div className="flex h-8 shrink-0 items-center border-b border-black/10 px-1.5">
            <button
              aria-label="Переместить стикер"
              className="grid h-7 flex-1 cursor-grab place-items-center rounded-sm text-black/45 hover:bg-white/30 hover:text-black/70 active:cursor-grabbing"
              onPointerDown={startMove}
              type="button"
            >
              <GripHorizontal aria-hidden className="size-4" />
            </button>
            <button
              aria-label="Удалить стикер"
              className="grid size-7 place-items-center rounded-sm text-black/45 hover:bg-white/40 hover:text-[var(--color-danger)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
              onClick={(event) => {
                event.stopPropagation();
                onDelete?.(sticker.id);
              }}
              type="button"
            >
              <Trash2 aria-hidden className="size-3.5" />
            </button>
          </div>
          <textarea
            aria-label="Текст стикера"
            className="min-h-0 flex-1 resize-none border-0 bg-transparent px-3 py-2 leading-snug outline-none placeholder:text-black/35"
            defaultValue={sticker.text}
            maxLength={1000}
            onBlur={(event) => {
              const normalized = event.target.value.trim();
              if (normalized && normalized !== sticker.text) {
                onUpdate?.(sticker.id, { text: normalized });
              }
              else event.target.value = sticker.text;
            }}
            onChange={(event) => {
              const normalized = event.target.value.trim();
              if (normalized && normalized !== sticker.text) {
                onUpdate?.(sticker.id, { text: normalized });
              }
            }}
            onPointerDown={(event) => event.stopPropagation()}
            placeholder="Введите заметку"
            style={{ fontSize: stickerFontSize(size) }}
          />
          <div className="flex h-8 shrink-0 items-center gap-1 px-2">
            {STICKER_COLORS.map((color) => (
              <button
                aria-label={`Цвет стикера: ${COLOR_LABELS[color]}`}
                aria-pressed={sticker.color === color}
                className="sticker-color-button size-4 rounded-full border border-black/15 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-focus)]"
                data-color={color}
                key={color}
                onClick={(event) => {
                  event.stopPropagation();
                  onUpdate?.(sticker.id, { color });
                }}
                type="button"
              />
            ))}
          </div>
          <button
            aria-label="Изменить размер стикера"
            className="absolute bottom-0 right-0 grid size-7 cursor-nwse-resize place-items-center text-black/40 hover:text-black/70"
            onPointerDown={startResize}
            type="button"
          >
            <Maximize2 aria-hidden className="size-3.5" />
          </button>
        </>
      )}
    </article>
  );
}

export function StickerLayer({
  stickers,
  dayWidth,
  rowHeight,
  timelineWidth,
  canvasHeight,
  isPlacing = false,
  readOnly = false,
  onPlace,
  onUpdate,
  onDelete,
  onActivate,
}: Props) {
  function placeSticker(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isPlacing || event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const left = clamp(
      event.clientX - bounds.left - DEFAULT_STICKER_SIZE / 2,
      0,
      timelineWidth - dayWidth,
    );
    const top = clamp(
      event.clientY - bounds.top - DEFAULT_STICKER_SIZE / 2,
      0,
      bounds.height - DEFAULT_STICKER_SIZE,
    );
    onPlace?.(
      Number((left / dayWidth).toFixed(4)),
      Number((top / rowHeight).toFixed(4)),
    );
  }

  return (
    <div
      aria-label="Стикеры проекта"
      className={`absolute inset-0 z-40 ${isPlacing ? 'cursor-crosshair' : ''}`}
      onPointerDown={placeSticker}
      style={{ pointerEvents: isPlacing ? 'auto' : 'none' }}
    >
      {stickers.map((sticker) => (
        <StickerCard
          canvasHeight={canvasHeight}
          dayWidth={dayWidth}
          key={sticker.id}
          onActivate={onActivate}
          onDelete={onDelete}
          onUpdate={onUpdate}
          readOnly={readOnly}
          rowHeight={rowHeight}
          sticker={sticker}
          timelineWidth={timelineWidth}
        />
      ))}
    </div>
  );
}
