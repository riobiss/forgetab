ALTER TABLE "rpg_class_templates"
ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'geral';
