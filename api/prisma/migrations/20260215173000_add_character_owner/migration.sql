ALTER TABLE "rpg_characters"
ADD COLUMN "created_by_user_id" TEXT;

CREATE INDEX "rpg_characters_created_by_user_id_idx" ON "rpg_characters"("created_by_user_id");
CREATE INDEX "rpg_characters_rpg_id_created_by_user_id_idx" ON "rpg_characters"("rpg_id", "created_by_user_id");

ALTER TABLE "rpg_characters"
ADD CONSTRAINT "rpg_characters_created_by_user_id_fkey"
FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
