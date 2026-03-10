ALTER TABLE "rpg_race_templates"
ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'geral',
ADD COLUMN IF NOT EXISTS "catalog_meta" JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE "rpg_race_templates"
SET "category" = 'geral'
WHERE "category" IS NULL OR BTRIM("category") = '';

ALTER TABLE "rpg_class_templates"
ADD COLUMN IF NOT EXISTS "catalog_meta" JSONB NOT NULL DEFAULT '{}'::jsonb;
