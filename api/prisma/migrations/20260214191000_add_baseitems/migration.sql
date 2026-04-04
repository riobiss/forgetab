-- CreateEnum
CREATE TYPE "public"."BaseItemType" AS ENUM ('weapon', 'armor', 'consumable', 'accessory', 'material', 'quest');

-- CreateEnum
CREATE TYPE "public"."BaseItemRarity" AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');

-- CreateTable
CREATE TABLE "baseitems" (
    "id" TEXT NOT NULL,
    "rpg_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."BaseItemType" NOT NULL,
    "rarity" "public"."BaseItemRarity" NOT NULL DEFAULT 'common',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "baseitems_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "baseitems_rpg_id_idx" ON "baseitems"("rpg_id");

-- AddForeignKey
ALTER TABLE "baseitems" ADD CONSTRAINT "baseitems_rpg_id_fkey" FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
