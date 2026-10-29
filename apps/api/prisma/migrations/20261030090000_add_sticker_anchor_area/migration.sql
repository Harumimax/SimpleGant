ALTER TABLE "stickers"
ADD COLUMN "anchor_area" VARCHAR(20) NOT NULL DEFAULT 'timeline',
ADD COLUMN "x_task_offset" DOUBLE PRECISION;
