CREATE TABLE "stickers" (
  "id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "text" VARCHAR(1000) NOT NULL,
  "color" VARCHAR(20) NOT NULL DEFAULT 'amber',
  "x_day_offset" DOUBLE PRECISION NOT NULL,
  "y_row_offset" DOUBLE PRECISION NOT NULL,
  "size" INTEGER NOT NULL DEFAULT 160,
  "z_index" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "stickers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "stickers_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "projects"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "stickers_project_id_z_index_idx"
ON "stickers"("project_id", "z_index");
