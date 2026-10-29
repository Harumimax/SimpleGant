import { GripHorizontal, Trash2 } from 'lucide-react';
import {
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import {
  STICKER_COLORS,
  type Sticker,
  type StickerAnchorArea,
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
type ResizeDirection = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
export type StickerPlacement = Pick<
  Sticker,
  'anchorArea' | 'xDayOffset' | 'xTaskOffset' | 'yRowOffset'
>;

const RESIZE_HANDLES: Array<{
  direction: ResizeDirection;
  label: string;
  className: string;
  cursor: CSSProperties['cursor'];
}> = [
  { direction: 'n', label: 'Изменить размер за верхний край', className: 'left-4 right-4 top-0 h-1.5', cursor: 'ns-resize' },
  { direction: 'ne', label: 'Изменить размер за правый верхний угол', className: 'right-0 top-0 size-4', cursor: 'nesw-resize' },
  { direction: 'e', label: 'Изменить размер за правый край', className: 'bottom-4 right-0 top-4 w-1.5', cursor: 'ew-resize' },
  { direction: 'se', label: 'Изменить размер за правый нижний угол', className: 'bottom-0 right-0 size-6', cursor: 'nwse-resize' },
  { direction: 's', label: 'Изменить размер за нижний край', className: 'bottom-0 left-4 right-4 h-1.5', cursor: 'ns-resize' },
  { direction: 'sw', label: 'Изменить размер за левый нижний угол', className: 'bottom-0 left-0 size-4', cursor: 'nesw-resize' },
  { direction: 'w', label: 'Изменить размер за левый край', className: 'bottom-4 left-0 top-4 w-1.5', cursor: 'ew-resize' },
  { direction: 'nw', label: 'Изменить размер за левый верхний угол', className: 'left-0 top-0 size-4', cursor: 'nwse-resize' },
];

type Props = {
  stickers: Sticker[];
  dayWidth: number;
  rowHeight: number;
  timelineWidth: number;
  canvasHeight: number;
  taskPaneWidth: number;
  timelineScrollLeft: number;
  verticalScrollTop: number;
  isPlacing?: boolean;
  readOnly?: boolean;
  onPlace?: (placement: StickerPlacement) => void;
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
  taskPaneWidth,
  timelineScrollLeft,
  verticalScrollTop,
  readOnly,
  onUpdate,
  onDelete,
  onActivate,
}: Omit<Props, 'stickers' | 'isPlacing' | 'onPlace'> & { sticker: Sticker }) {
  const initialPoint = {
    left: sticker.anchorArea === 'tasks'
      ? Math.min(
          sticker.xTaskOffset ?? 0,
          Math.max(0, taskPaneWidth - sticker.size),
        )
      : taskPaneWidth + sticker.xDayOffset * dayWidth - timelineScrollLeft,
    top: sticker.yRowOffset * rowHeight - verticalScrollTop,
  };
  const [previewPoint, setPreviewPoint] = useState<Point | null>(null);
  const [previewSize, setPreviewSize] = useState<number | null>(null);
  const point = previewPoint ?? initialPoint;
  const size = previewSize ?? sticker.size;

  function placementFor(
    nextPoint: Point,
    nextSize: number,
    forcedArea?: StickerAnchorArea,
  ): StickerPlacement {
    const area = forcedArea ?? (
      nextPoint.left + nextSize / 2 < taskPaneWidth ? 'tasks' : 'timeline'
    );
    const maximumDayOffset = Math.max(0, timelineWidth / dayWidth - 1);
    return {
      anchorArea: area,
      xDayOffset: area === 'timeline'
        ? Number(clamp(
            (nextPoint.left - taskPaneWidth + timelineScrollLeft) / dayWidth,
            0,
            maximumDayOffset,
          ).toFixed(4))
        : sticker.xDayOffset,
      xTaskOffset: area === 'tasks'
        ? Number(clamp(
            nextPoint.left,
            0,
            taskPaneWidth - nextSize,
          ).toFixed(2))
        : null,
      yRowOffset: Number((
        (nextPoint.top + verticalScrollTop) / rowHeight
      ).toFixed(4)),
    };
  }

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
    const activeBoardWidth = event.currentTarget.closest('[aria-label="Стикеры проекта"]')?.clientWidth
      ?? taskPaneWidth + timelineWidth;

    const move = (moveEvent: PointerEvent) => {
      setPreviewPoint({
        left: clamp(startPoint.left + moveEvent.clientX - startX, 0, activeBoardWidth - sticker.size),
        top: clamp(startPoint.top + moveEvent.clientY - startY, 0, activeCanvasHeight - sticker.size),
      });
    };
    const finish = (upEvent: PointerEvent) => {
      const nextPoint = {
        left: clamp(startPoint.left + upEvent.clientX - startX, 0, activeBoardWidth - sticker.size),
        top: clamp(startPoint.top + upEvent.clientY - startY, 0, activeCanvasHeight - sticker.size),
      };
      setPreviewPoint(null);
      onUpdate?.(sticker.id, placementFor(nextPoint, sticker.size));
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

  function startResize(
    event: ReactPointerEvent<HTMLButtonElement>,
    direction: ResizeDirection,
  ) {
    if (readOnly) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    onActivate?.(sticker.id);
    const startX = event.clientX;
    const startY = event.clientY;
    const startPoint = initialPoint;
    const startSize = sticker.size;
    const activeCanvasHeight = event.currentTarget.closest('[aria-label="Стикеры проекта"]')?.clientHeight
      ?? canvasHeight;
    const activeBoardWidth = event.currentTarget.closest('[aria-label="Стикеры проекта"]')?.clientWidth
      ?? taskPaneWidth + timelineWidth;
    const resizeFromNorth = direction.includes('n');
    const resizeFromWest = direction.includes('w');
    const maximumSize = Math.max(
      MIN_STICKER_SIZE,
      Math.min(
        MAX_STICKER_SIZE,
        resizeFromNorth
          ? startPoint.top + startSize
          : activeCanvasHeight - startPoint.top,
        resizeFromWest
          ? startPoint.left + startSize
          : activeBoardWidth - startPoint.left,
      ),
    );

    const geometryFor = (clientX: number, clientY: number) => {
      const deltaX = direction.includes('e')
        ? clientX - startX
        : direction.includes('w') ? startX - clientX : null;
      const deltaY = direction.includes('s')
        ? clientY - startY
        : direction.includes('n') ? startY - clientY : null;
      const sizeDelta = deltaX === null
        ? deltaY ?? 0
        : deltaY === null
          ? deltaX
          : Math.abs(deltaX) >= Math.abs(deltaY) ? deltaX : deltaY;
      const nextSize = Math.round(clamp(
        startSize + sizeDelta,
        MIN_STICKER_SIZE,
        maximumSize,
      ));
      return {
        point: {
          left: resizeFromWest
            ? startPoint.left + startSize - nextSize
            : startPoint.left,
          top: resizeFromNorth
            ? startPoint.top + startSize - nextSize
            : startPoint.top,
        },
        size: nextSize,
      };
    };
    const move = (moveEvent: PointerEvent) => {
      const geometry = geometryFor(moveEvent.clientX, moveEvent.clientY);
      setPreviewPoint(geometry.point);
      setPreviewSize(geometry.size);
    };
    const finish = (upEvent: PointerEvent) => {
      const geometry = geometryFor(upEvent.clientX, upEvent.clientY);
      setPreviewPoint(null);
      setPreviewSize(null);
      onUpdate?.(sticker.id, {
        size: geometry.size,
        ...placementFor(geometry.point, geometry.size, sticker.anchorArea),
      });
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', cancel);
    };
    const cancel = () => {
      setPreviewPoint(null);
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
          {RESIZE_HANDLES.map((handle) => (
            <button
              aria-label={handle.label}
              className={`absolute z-20 bg-transparent ${handle.className}`}
              key={handle.direction}
              onPointerDown={(event) => startResize(event, handle.direction)}
              style={{ cursor: handle.cursor }}
              type="button"
            />
          ))}
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
  taskPaneWidth,
  timelineScrollLeft,
  verticalScrollTop,
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
      bounds.width - DEFAULT_STICKER_SIZE,
    );
    const top = clamp(
      event.clientY - bounds.top - DEFAULT_STICKER_SIZE / 2,
      0,
      bounds.height - DEFAULT_STICKER_SIZE,
    );
    const anchorArea: StickerAnchorArea = event.clientX - bounds.left < taskPaneWidth
      ? 'tasks'
      : 'timeline';
    onPlace?.({
      anchorArea,
      xDayOffset: anchorArea === 'timeline'
        ? Number(clamp(
            (left - taskPaneWidth + timelineScrollLeft) / dayWidth,
            0,
            Math.max(0, timelineWidth / dayWidth - 1),
          ).toFixed(4))
        : 0,
      xTaskOffset: anchorArea === 'tasks'
        ? Number(clamp(
            left,
            0,
            taskPaneWidth - DEFAULT_STICKER_SIZE,
          ).toFixed(2))
        : null,
      yRowOffset: Number((
        (top + verticalScrollTop) / rowHeight
      ).toFixed(4)),
    });
  }

  return (
    <div
      aria-label="Стикеры проекта"
      className={`absolute inset-x-0 bottom-0 top-[90px] z-40 overflow-hidden ${isPlacing ? 'cursor-crosshair' : ''}`}
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
          taskPaneWidth={taskPaneWidth}
          timelineScrollLeft={timelineScrollLeft}
          timelineWidth={timelineWidth}
          verticalScrollTop={verticalScrollTop}
        />
      ))}
    </div>
  );
}
