CREATE TABLE "rpg_creature_danger_levels" (
    "id" TEXT NOT NULL,
    "rpg_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rpg_creature_danger_levels_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rpg_creature_danger_levels_rpg_id_idx" ON "rpg_creature_danger_levels"("rpg_id");

CREATE UNIQUE INDEX "rpg_creature_danger_levels_rpg_id_key_key" ON "rpg_creature_danger_levels"("rpg_id", "key");

ALTER TABLE "rpg_creature_danger_levels"
ADD CONSTRAINT "rpg_creature_danger_levels_rpg_id_fkey"
FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
