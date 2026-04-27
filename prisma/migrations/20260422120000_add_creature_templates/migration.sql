CREATE TABLE "rpg_creature_template_categories" (
  "id" TEXT NOT NULL,
  "rpg_id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "rpg_creature_template_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rpg_creature_template_fields" (
  "id" TEXT NOT NULL,
  "rpg_id" TEXT NOT NULL,
  "category_id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "rpg_creature_template_fields_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rpg_creature_template_categories_rpg_id_idx"
  ON "rpg_creature_template_categories"("rpg_id");

CREATE UNIQUE INDEX "rpg_creature_template_categories_rpg_id_key_key"
  ON "rpg_creature_template_categories"("rpg_id", "key");

CREATE INDEX "rpg_creature_template_fields_rpg_id_idx"
  ON "rpg_creature_template_fields"("rpg_id");

CREATE INDEX "rpg_creature_template_fields_category_id_idx"
  ON "rpg_creature_template_fields"("category_id");

CREATE UNIQUE INDEX "rpg_creature_template_fields_category_id_key_key"
  ON "rpg_creature_template_fields"("category_id", "key");

ALTER TABLE "rpg_creature_template_categories"
  ADD CONSTRAINT "rpg_creature_template_categories_rpg_id_fkey"
  FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rpg_creature_template_fields"
  ADD CONSTRAINT "rpg_creature_template_fields_rpg_id_fkey"
  FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rpg_creature_template_fields"
  ADD CONSTRAINT "rpg_creature_template_fields_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "rpg_creature_template_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
