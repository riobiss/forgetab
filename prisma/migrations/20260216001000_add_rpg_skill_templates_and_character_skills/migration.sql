ALTER TABLE "rpg_characters"
ADD COLUMN "skills" JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE "rpg_skill_templates" (
    "id" TEXT NOT NULL,
    "rpg_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rpg_skill_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rpg_skill_templates_rpg_id_key_key" ON "rpg_skill_templates"("rpg_id", "key");
CREATE INDEX "rpg_skill_templates_rpg_id_idx" ON "rpg_skill_templates"("rpg_id");

ALTER TABLE "rpg_skill_templates" ADD CONSTRAINT "rpg_skill_templates_rpg_id_fkey"
FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
