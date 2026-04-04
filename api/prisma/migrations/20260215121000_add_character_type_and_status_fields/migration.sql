-- CreateEnum
CREATE TYPE "RpgCharacterType" AS ENUM ('player', 'npc', 'monster');

-- AlterTable
ALTER TABLE "rpg_characters"
ADD COLUMN "character_type" "RpgCharacterType" NOT NULL DEFAULT 'player',
ADD COLUMN "life" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "defense" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "mana" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "stamina" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "sanity" INTEGER NOT NULL DEFAULT 0;

