ALTER TABLE "rpg_library_books"
ADD COLUMN "visibility" "RpgVisibility" NOT NULL DEFAULT 'private';

ALTER TABLE "rpg_library_books"
ADD COLUMN "allowed_character_ids" JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "rpg_library_books"
ADD COLUMN "allowed_class_keys" JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "rpg_library_books"
ADD COLUMN "allowed_race_keys" JSONB NOT NULL DEFAULT '[]'::jsonb;
