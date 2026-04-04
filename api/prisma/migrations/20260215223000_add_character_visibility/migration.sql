ALTER TABLE "rpg_characters"
ADD COLUMN "visibility" "public"."RpgVisibility" NOT NULL DEFAULT 'public';

CREATE INDEX "rpg_characters_visibility_idx" ON "rpg_characters"("visibility");
