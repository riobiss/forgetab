ALTER TABLE "rpg_library_books"
ADD COLUMN "created_by_user_id" TEXT;

CREATE INDEX "rpg_library_books_created_by_user_id_idx"
ON "rpg_library_books"("created_by_user_id");
