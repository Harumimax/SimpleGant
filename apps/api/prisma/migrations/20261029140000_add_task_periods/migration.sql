ALTER TABLE "tasks"
ADD COLUMN "include_in_duration" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "periods" JSONB NOT NULL DEFAULT '[]'::jsonb;
