export const STICKER_COLORS = [
  'amber',
  'sky',
  'sage',
  'rose',
  'lavender',
  'sand',
] as const;

export type StickerColor = (typeof STICKER_COLORS)[number];

export type Sticker = {
  id: string;
  projectId: string;
  text: string;
  color: StickerColor;
  xDayOffset: number;
  yRowOffset: number;
  size: number;
  zIndex: number;
  createdAt: string;
  updatedAt: string;
};

export type StickerUpdate = Partial<Pick<
  Sticker,
  'text' | 'color' | 'xDayOffset' | 'yRowOffset' | 'size' | 'zIndex'
>>;
