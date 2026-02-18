CREATE TABLE "rpg_library_sections" (
  "id" TEXT NOT NULL,
  "rpg_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rpg_library_sections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rpg_library_books" (
  "id" TEXT NOT NULL,
  "rpg_id" TEXT NOT NULL,
  "section_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" JSONB NOT NULL DEFAULT '{"type":"doc","content":[]}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rpg_library_books_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rpg_library_sections_rpg_id_idx" ON "rpg_library_sections"("rpg_id");
CREATE INDEX "rpg_library_books_rpg_id_idx" ON "rpg_library_books"("rpg_id");
CREATE INDEX "rpg_library_books_section_id_idx" ON "rpg_library_books"("section_id");

ALTER TABLE "rpg_library_sections"
ADD CONSTRAINT "rpg_library_sections_rpg_id_fkey"
FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rpg_library_books"
ADD CONSTRAINT "rpg_library_books_rpg_id_fkey"
FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rpg_library_books"
ADD CONSTRAINT "rpg_library_books_section_id_fkey"
FOREIGN KEY ("section_id") REFERENCES "rpg_library_sections"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
