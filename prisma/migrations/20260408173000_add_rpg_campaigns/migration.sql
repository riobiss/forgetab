CREATE TYPE "public"."RpgCampaignMessageKind" AS ENUM ('campaign', 'direct', 'action');

CREATE TABLE "rpg_campaigns" (
    "id" TEXT NOT NULL,
    "rpg_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3),
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

CREATE UNIQUE INDEX "rpg_campaign_participants_campaign_id_user_id_key" ON "rpg_campaign_participants"("campaign_id", "user_id");
CREATE INDEX "rpg_campaigns_rpg_id_idx" ON "rpg_campaigns"("rpg_id");
CREATE INDEX "rpg_campaigns_rpg_id_is_active_idx" ON "rpg_campaigns"("rpg_id", "is_active");
CREATE INDEX "rpg_campaign_participants_campaign_id_idx" ON "rpg_campaign_participants"("campaign_id");
CREATE INDEX "rpg_campaign_participants_user_id_idx" ON "rpg_campaign_participants"("user_id");
CREATE INDEX "rpg_campaign_messages_campaign_id_idx" ON "rpg_campaign_messages"("campaign_id");
CREATE INDEX "rpg_campaign_messages_user_id_idx" ON "rpg_campaign_messages"("user_id");
CREATE INDEX "rpg_campaign_messages_recipient_user_id_idx" ON "rpg_campaign_messages"("recipient_user_id");

ALTER TABLE "rpg_campaigns" ADD CONSTRAINT "rpg_campaigns_rpg_id_fkey" FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rpg_campaign_participants" ADD CONSTRAINT "rpg_campaign_participants_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "rpg_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rpg_campaign_participants" ADD CONSTRAINT "rpg_campaign_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rpg_campaign_messages" ADD CONSTRAINT "rpg_campaign_messages_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "rpg_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rpg_campaign_messages" ADD CONSTRAINT "rpg_campaign_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rpg_campaign_messages" ADD CONSTRAINT "rpg_campaign_messages_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
