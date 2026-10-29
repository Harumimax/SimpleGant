export const STICKER_COLORS = [
  'amber',
  'sky',
  'sage',
  'rose',
  'lavender',
  'sand',
] as const;

export type StickerColor = (typeof STICKER_COLORS)[number];

export const STICKER_ANCHOR_AREAS = ['timeline', 'tasks'] as const;
export type StickerAnchorArea = (typeof STICKER_ANCHOR_AREAS)[number];

export const MAX_PROJECT_STICKERS = 50;
export const MIN_STICKER_SIZE = 120;
export const MAX_STICKER_SIZE = 320;
