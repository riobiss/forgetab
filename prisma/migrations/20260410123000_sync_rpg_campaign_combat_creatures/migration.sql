DROP INDEX IF EXISTS "rpg_campaign_combat_participants_combat_id_user_id_key";

ALTER TABLE IF EXISTS "rpg_campaign_combat_participants"
  ALTER COLUMN "user_id" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "source_character_id" TEXT,
  ADD COLUMN IF NOT EXISTS "actor_type" TEXT NOT NULL DEFAULT 'player',
  ADD COLUMN IF NOT EXISTS "label" TEXT,
  ADD COLUMN IF NOT EXISTS "items" JSONB,
  ADD COLUMN IF NOT EXISTS "roll_config" JSONB,
  ADD COLUMN IF NOT EXISTS "stat_rolls" JSONB;

ALTER TABLE IF EXISTS "rpg_campaign_combat_queue_entries"
  ALTER COLUMN "user_id" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "participant_id" TEXT;

UPDATE "rpg_campaign_combat_queue_entries" q
SET "participant_id" = p.id
FROM "rpg_campaign_combat_participants" p
WHERE q."participant_id" IS NULL
  AND p."combat_id" = q."combat_id"
  AND p."user_id" = q."user_id";

DELETE FROM "rpg_campaign_combat_queue_entries"
WHERE "participant_id" IS NULL;

ALTER TABLE IF EXISTS "rpg_campaign_combat_queue_entries"
  ALTER COLUMN "participant_id" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "rpg_campaign_combat_participants_source_character_id_idx" ON "rpg_campaign_combat_participants"("source_character_id");
CREATE INDEX IF NOT EXISTS "rpg_campaign_combat_queue_entries_participant_id_idx" ON "rpg_campaign_combat_queue_entries"("participant_id");
