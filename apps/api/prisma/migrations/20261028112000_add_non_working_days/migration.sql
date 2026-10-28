CREATE TABLE "non_working_days" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "label" VARCHAR(120),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "non_working_days_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "non_working_days_project_id_date_key"
ON "non_working_days"("project_id", "date");

CREATE INDEX "non_working_days_project_id_date_idx"
ON "non_working_days"("project_id", "date");

ALTER TABLE "non_working_days"
ADD CONSTRAINT "non_working_days_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "projects"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
