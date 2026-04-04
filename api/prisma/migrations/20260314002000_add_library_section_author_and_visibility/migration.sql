ALTER TABLE "rpg_library_sections"
ADD COLUMN "created_by_user_id" TEXT;

CREATE INDEX "rpg_library_sections_created_by_user_id_idx"
ON "rpg_library_sections"("created_by_user_id");
