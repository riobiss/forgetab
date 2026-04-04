ALTER TABLE "rpg_library_sections"
ADD COLUMN "visibility" "public"."RpgVisibility" NOT NULL DEFAULT 'public';

CREATE INDEX "rpg_library_sections_visibility_idx" ON "rpg_library_sections"("visibility");
