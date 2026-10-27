-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "parent_id" UUID,
    "order_index" INTEGER NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "title" VARCHAR(200) NOT NULL,
    "work_type" VARCHAR(200),
    "assignee" VARCHAR(200) NOT NULL,
    "estimate" VARCHAR(100),
    "status" VARCHAR(30) NOT NULL DEFAULT 'Ожидает',
    "start_date" DATE,
    "end_date" DATE,
    "color" VARCHAR(20) NOT NULL DEFAULT 'sage',
    "is_collapsed" BOOLEAN NOT NULL DEFAULT false,
    "custom_fields" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tasks_project_id_order_index_idx" ON "tasks"("project_id", "order_index");

-- CreateIndex
CREATE INDEX "tasks_parent_id_idx" ON "tasks"("parent_id");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
