CREATE TYPE "CharacterCreationRequestStatus" AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE "rpg_character_creation_requests" (
    "id" TEXT NOT NULL,
    "rpg_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "CharacterCreationRequestStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "rpg_character_creation_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rpg_character_creation_requests_rpg_id_user_id_key"
ON "rpg_character_creation_requests"("rpg_id", "user_id");

CREATE INDEX "rpg_character_creation_requests_rpg_id_idx"
ON "rpg_character_creation_requests"("rpg_id");

CREATE INDEX "rpg_character_creation_requests_user_id_idx"
ON "rpg_character_creation_requests"("user_id");

ALTER TABLE "rpg_character_creation_requests"
ADD CONSTRAINT "rpg_character_creation_requests_rpg_id_fkey"
FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rpg_character_creation_requests"
ADD CONSTRAINT "rpg_character_creation_requests_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
