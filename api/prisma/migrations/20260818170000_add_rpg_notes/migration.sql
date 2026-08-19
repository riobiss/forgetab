CREATE TABLE "rpg_notes" (
    "id" TEXT NOT NULL,
    "rpg_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rpg_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rpg_notes_rpg_id_user_id_updated_at_idx"
ON "rpg_notes"("rpg_id", "user_id", "updated_at");

ALTER TABLE "rpg_notes"
ADD CONSTRAINT "rpg_notes_rpg_id_fkey"
FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rpg_notes"
ADD CONSTRAINT "rpg_notes_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
