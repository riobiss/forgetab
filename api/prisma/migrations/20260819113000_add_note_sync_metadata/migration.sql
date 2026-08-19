ALTER TABLE "rpg_notes"
ADD COLUMN "client_id" TEXT,
ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "rpg_notes_rpg_id_user_id_client_id_key"
ON "rpg_notes"("rpg_id", "user_id", "client_id");
