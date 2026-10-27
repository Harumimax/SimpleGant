UPDATE "project_columns"
SET "name" = 'Длительность', "key" = 'duration', "updated_at" = CURRENT_TIMESTAMP
WHERE "is_default" = true AND "key" = 'estimate';
