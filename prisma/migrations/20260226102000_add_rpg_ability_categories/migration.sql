ALTER TABLE "rpgs"
ADD COLUMN IF NOT EXISTS "ability_categories_enabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "rpgs"
ADD COLUMN IF NOT EXISTS "enabled_ability_categories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
