ALTER TABLE "rpg_map_markers"
ADD COLUMN "size" DOUBLE PRECISION DEFAULT 1,
ADD COLUMN "pin_style" TEXT DEFAULT 'default';

UPDATE "rpg_map_markers"
SET "size" = COALESCE("size", 1),
    "pin_style" = COALESCE("pin_style", 'default');
