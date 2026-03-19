CREATE TABLE "rpg_maps" (
  "id" TEXT NOT NULL,
  "rpg_id" TEXT NOT NULL,
  "created_by_user_id" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT,
  "image" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "rpg_maps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rpg_map_sections" (
  "id" TEXT NOT NULL,
  "map_id" TEXT NOT NULL,
  "rpg_id" TEXT NOT NULL,
  "parent_section_id" TEXT,
  "created_by_user_id" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  "custom_fields" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "rpg_map_sections_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rpg_maps_rpg_id_idx" ON "rpg_maps"("rpg_id");
CREATE INDEX "rpg_maps_created_by_user_id_idx" ON "rpg_maps"("created_by_user_id");
CREATE INDEX "rpg_map_sections_map_id_idx" ON "rpg_map_sections"("map_id");
CREATE INDEX "rpg_map_sections_rpg_id_idx" ON "rpg_map_sections"("rpg_id");
CREATE INDEX "rpg_map_sections_parent_section_id_idx" ON "rpg_map_sections"("parent_section_id");
CREATE INDEX "rpg_map_sections_map_id_parent_section_id_position_idx" ON "rpg_map_sections"("map_id", "parent_section_id", "position");
CREATE INDEX "rpg_map_sections_created_by_user_id_idx" ON "rpg_map_sections"("created_by_user_id");

ALTER TABLE "rpg_maps"
  ADD CONSTRAINT "rpg_maps_rpg_id_fkey"
  FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rpg_map_sections"
  ADD CONSTRAINT "rpg_map_sections_map_id_fkey"
  FOREIGN KEY ("map_id") REFERENCES "rpg_maps"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rpg_map_sections"
  ADD CONSTRAINT "rpg_map_sections_rpg_id_fkey"
  FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rpg_map_sections"
  ADD CONSTRAINT "rpg_map_sections_parent_section_id_fkey"
  FOREIGN KEY ("parent_section_id") REFERENCES "rpg_map_sections"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
