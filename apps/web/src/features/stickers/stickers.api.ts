export const STICKER_COLORS = [
  'amber',
  'sky',
  'sage',
  'rose',
  'lavender',
  'sand',
] as const;

export type StickerColor = (typeof STICKER_COLORS)[number];
export type StickerAnchorArea = 'timeline' | 'tasks';

export type Sticker = {
  id: string;
  projectId: string;
  text: string;
  color: StickerColor;
  anchorArea: StickerAnchorArea;
  xDayOffset: number;
  xTaskOffset: number | null;
  yRowOffset: number;
  size: number;
  zIndex: number;
  createdAt: string;
  updatedAt: string;
};

export type StickerUpdate = Partial<Pick<
  Sticker,
  | 'text'
  | 'color'
  | 'anchorArea'
  | 'xDayOffset'
  | 'xTaskOffset'
  | 'yRowOffset'
  | 'size'
  | 'zIndex'
>>;
