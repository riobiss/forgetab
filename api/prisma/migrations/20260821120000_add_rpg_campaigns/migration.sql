CREATE TYPE "public"."RpgCampaignMessageKind" AS ENUM ('campaign', 'direct', 'action');

CREATE TABLE "rpg_campaigns" (
    "id" TEXT NOT NULL,
    "rpg_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rpg_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rpg_campaign_participants" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rpg_campaign_participants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rpg_campaign_messages" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recipient_user_id" TEXT,
    "kind" "public"."RpgCampaignMessageKind" NOT NULL DEFAULT 'campaign',
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rpg_campaign_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rpg_campaign_combats" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "created_by_user_id" TEXT,
    "name" TEXT NOT NULL,
    "active_turn_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rpg_campaign_combats_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rpg_campaign_combat_participants" (
    "id" TEXT NOT NULL,
    "combat_id" TEXT NOT NULL,
    "user_id" TEXT,
    "character_id" TEXT,
    "source_character_id" TEXT,
    "actor_type" TEXT NOT NULL DEFAULT 'player',
    "label" TEXT,
    "role" TEXT NOT NULL,
    "items" JSONB,
    "roll_config" JSONB,
    "stat_rolls" JSONB,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rpg_campaign_combat_participants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rpg_campaign_combat_queue_entries" (
    "id" TEXT NOT NULL,
    "combat_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "label" TEXT NOT NULL,
    "roll" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rpg_campaign_combat_queue_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rpg_campaign_participants_campaign_id_user_id_key" ON "rpg_campaign_participants"("campaign_id", "user_id");
CREATE INDEX "rpg_campaigns_rpg_id_idx" ON "rpg_campaigns"("rpg_id");
CREATE INDEX "rpg_campaigns_rpg_id_is_active_idx" ON "rpg_campaigns"("rpg_id", "is_active");
CREATE INDEX "rpg_campaign_participants_campaign_id_idx" ON "rpg_campaign_participants"("campaign_id");
CREATE INDEX "rpg_campaign_participants_user_id_idx" ON "rpg_campaign_participants"("user_id");
CREATE INDEX "rpg_campaign_messages_campaign_id_idx" ON "rpg_campaign_messages"("campaign_id");
CREATE INDEX "rpg_campaign_messages_user_id_idx" ON "rpg_campaign_messages"("user_id");
CREATE INDEX "rpg_campaign_messages_recipient_user_id_idx" ON "rpg_campaign_messages"("recipient_user_id");
CREATE INDEX "rpg_campaign_combats_campaign_id_idx" ON "rpg_campaign_combats"("campaign_id");
CREATE INDEX "rpg_campaign_combats_created_by_user_id_idx" ON "rpg_campaign_combats"("created_by_user_id");
CREATE INDEX "rpg_campaign_combat_participants_combat_id_idx" ON "rpg_campaign_combat_participants"("combat_id");
CREATE INDEX "rpg_campaign_combat_participants_user_id_idx" ON "rpg_campaign_combat_participants"("user_id");
CREATE INDEX "rpg_campaign_combat_participants_character_id_idx" ON "rpg_campaign_combat_participants"("character_id");
CREATE INDEX "rpg_campaign_combat_participants_source_character_id_idx" ON "rpg_campaign_combat_participants"("source_character_id");
CREATE INDEX "rpg_campaign_combat_queue_entries_combat_id_idx" ON "rpg_campaign_combat_queue_entries"("combat_id");
CREATE INDEX "rpg_campaign_combat_queue_entries_participant_id_idx" ON "rpg_campaign_combat_queue_entries"("participant_id");
CREATE INDEX "rpg_campaign_combat_queue_entries_user_id_idx" ON "rpg_campaign_combat_queue_entries"("user_id");
CREATE INDEX "rpg_campaign_combat_queue_entries_combat_id_position_idx" ON "rpg_campaign_combat_queue_entries"("combat_id", "position");

ALTER TABLE "rpg_campaigns" ADD CONSTRAINT "rpg_campaigns_rpg_id_fkey" FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rpg_campaign_participants" ADD CONSTRAINT "rpg_campaign_participants_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "rpg_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rpg_campaign_participants" ADD CONSTRAINT "rpg_campaign_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rpg_campaign_messages" ADD CONSTRAINT "rpg_campaign_messages_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "rpg_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rpg_campaign_messages" ADD CONSTRAINT "rpg_campaign_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rpg_campaign_messages" ADD CONSTRAINT "rpg_campaign_messages_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rpg_campaign_combats" ADD CONSTRAINT "rpg_campaign_combats_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "rpg_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rpg_campaign_combats" ADD CONSTRAINT "rpg_campaign_combats_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "rpg_campaign_combat_participants" ADD CONSTRAINT "rpg_campaign_combat_participants_combat_id_fkey" FOREIGN KEY ("combat_id") REFERENCES "rpg_campaign_combats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rpg_campaign_combat_participants" ADD CONSTRAINT "rpg_campaign_combat_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rpg_campaign_combat_participants" ADD CONSTRAINT "rpg_campaign_combat_participants_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "rpg_characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "rpg_campaign_combat_queue_entries" ADD CONSTRAINT "rpg_campaign_combat_queue_entries_combat_id_fkey" FOREIGN KEY ("combat_id") REFERENCES "rpg_campaign_combats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
