ALTER TABLE "rpgs"
ADD COLUMN "progression_mode" TEXT NOT NULL DEFAULT 'xp_level',
ADD COLUMN "progression_tiers" JSONB NOT NULL DEFAULT '[{"label":"Level 1","required":0},{"label":"Level 2","required":100}]';

ALTER TABLE "rpg_characters"
ADD COLUMN "progression_mode" TEXT NOT NULL DEFAULT 'xp_level',
ADD COLUMN "progression_label" TEXT NOT NULL DEFAULT 'Level 1',
ADD COLUMN "progression_required" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "progression_current" INTEGER NOT NULL DEFAULT 0;
