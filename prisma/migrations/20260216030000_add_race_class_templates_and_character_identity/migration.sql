ALTER TABLE "rpgs"
ADD COLUMN "use_class_race_bonuses" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "rpg_characters"
ADD COLUMN "race_key" TEXT,
ADD COLUMN "class_key" TEXT;

CREATE INDEX "rpg_characters_rpg_id_race_key_idx" ON "rpg_characters"("rpg_id", "race_key");
CREATE INDEX "rpg_characters_rpg_id_class_key_idx" ON "rpg_characters"("rpg_id", "class_key");

CREATE TABLE "rpg_race_templates" (
    "id" TEXT NOT NULL,
    "rpg_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "attribute_bonuses" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "skill_bonuses" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rpg_race_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rpg_class_templates" (
    "id" TEXT NOT NULL,
    "rpg_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "attribute_bonuses" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "skill_bonuses" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rpg_class_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rpg_race_templates_rpg_id_key_key" ON "rpg_race_templates"("rpg_id", "key");
CREATE INDEX "rpg_race_templates_rpg_id_idx" ON "rpg_race_templates"("rpg_id");

CREATE UNIQUE INDEX "rpg_class_templates_rpg_id_key_key" ON "rpg_class_templates"("rpg_id", "key");
CREATE INDEX "rpg_class_templates_rpg_id_idx" ON "rpg_class_templates"("rpg_id");

ALTER TABLE "rpg_race_templates"
ADD CONSTRAINT "rpg_race_templates_rpg_id_fkey"
FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rpg_class_templates"
ADD CONSTRAINT "rpg_class_templates_rpg_id_fkey"
FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
