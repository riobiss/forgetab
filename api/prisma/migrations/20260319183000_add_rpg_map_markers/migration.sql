CREATE TABLE "rpg_map_marker_groups" (
  "id" TEXT NOT NULL,
  "map_id" TEXT NOT NULL,
  "rpg_id" TEXT NOT NULL,
  "created_by_user_id" TEXT,
  "name" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rpg_map_marker_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rpg_map_markers" (
  "id" TEXT NOT NULL,
  "group_id" TEXT NOT NULL,
  "map_id" TEXT NOT NULL,
  "rpg_id" TEXT NOT NULL,
  "created_by_user_id" TEXT,
  "name" TEXT NOT NULL,
  "color" TEXT,
  "x" DOUBLE PRECISION NOT NULL,
  "y" DOUBLE PRECISION NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rpg_map_markers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rpg_map_marker_groups_map_id_idx" ON "rpg_map_marker_groups"("map_id");
CREATE INDEX "rpg_map_marker_groups_rpg_id_idx" ON "rpg_map_marker_groups"("rpg_id");
CREATE INDEX "rpg_map_marker_groups_created_by_user_id_idx" ON "rpg_map_marker_groups"("created_by_user_id");
CREATE INDEX "rpg_map_marker_groups_map_id_position_idx" ON "rpg_map_marker_groups"("map_id", "position");
CREATE INDEX "rpg_map_markers_group_id_idx" ON "rpg_map_markers"("group_id");
CREATE INDEX "rpg_map_markers_map_id_idx" ON "rpg_map_markers"("map_id");
CREATE INDEX "rpg_map_markers_rpg_id_idx" ON "rpg_map_markers"("rpg_id");
CREATE INDEX "rpg_map_markers_created_by_user_id_idx" ON "rpg_map_markers"("created_by_user_id");
CREATE INDEX "rpg_map_markers_group_id_position_idx" ON "rpg_map_markers"("group_id", "position");

ALTER TABLE "rpg_map_marker_groups"
  ADD CONSTRAINT "rpg_map_marker_groups_map_id_fkey"
  FOREIGN KEY ("map_id") REFERENCES "rpg_maps"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rpg_map_marker_groups"
  ADD CONSTRAINT "rpg_map_marker_groups_rpg_id_fkey"
  FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rpg_map_markers"
  ADD CONSTRAINT "rpg_map_markers_group_id_fkey"
  FOREIGN KEY ("group_id") REFERENCES "rpg_map_marker_groups"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rpg_map_markers"
  ADD CONSTRAINT "rpg_map_markers_map_id_fkey"
  FOREIGN KEY ("map_id") REFERENCES "rpg_maps"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rpg_map_markers"
  ADD CONSTRAINT "rpg_map_markers_rpg_id_fkey"
  FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
