CREATE TABLE "rpg_character_inventory_items" (
    "id" TEXT NOT NULL,
    "rpg_id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "base_item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rpg_character_inventory_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rpg_character_inventory_items_character_id_base_item_id_key"
ON "rpg_character_inventory_items"("character_id", "base_item_id");

CREATE INDEX "rpg_character_inventory_items_rpg_id_idx"
ON "rpg_character_inventory_items"("rpg_id");

CREATE INDEX "rpg_character_inventory_items_character_id_idx"
ON "rpg_character_inventory_items"("character_id");

CREATE INDEX "rpg_character_inventory_items_base_item_id_idx"
ON "rpg_character_inventory_items"("base_item_id");

ALTER TABLE "rpg_character_inventory_items"
ADD CONSTRAINT "rpg_character_inventory_items_rpg_id_fkey"
FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rpg_character_inventory_items"
ADD CONSTRAINT "rpg_character_inventory_items_character_id_fkey"
FOREIGN KEY ("character_id") REFERENCES "rpg_characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rpg_character_inventory_items"
ADD CONSTRAINT "rpg_character_inventory_items_base_item_id_fkey"
FOREIGN KEY ("base_item_id") REFERENCES "baseitems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
