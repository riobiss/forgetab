ALTER TABLE "rpgs"
ADD COLUMN "use_inventory_weight_limit" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "rpg_characters"
ADD COLUMN "max_carry_weight" DOUBLE PRECISION;
