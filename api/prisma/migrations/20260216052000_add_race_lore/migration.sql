ALTER TABLE "rpg_race_templates"
ADD COLUMN "lore" JSONB NOT NULL DEFAULT '{}'::jsonb;
