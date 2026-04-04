ALTER TABLE "rpg_characters"
ADD COLUMN "identity" JSONB;

CREATE TABLE "rpg_character_identity_templates" (
    "id" TEXT NOT NULL,
    "rpg_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rpg_character_identity_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rpg_character_identity_templates_rpg_id_key_key"
ON "rpg_character_identity_templates"("rpg_id", "key");

CREATE INDEX "rpg_character_identity_templates_rpg_id_idx"
ON "rpg_character_identity_templates"("rpg_id");

ALTER TABLE "rpg_character_identity_templates"
ADD CONSTRAINT "rpg_character_identity_templates_rpg_id_fkey"
FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
