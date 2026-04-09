CREATE TYPE "public"."RpgCampaignMessageKind" AS ENUM ('campaign', 'direct', 'action');

ALTER TABLE "rpg_campaign_messages"
ADD COLUMN "recipient_user_id" TEXT,
ADD COLUMN "kind" "public"."RpgCampaignMessageKind" NOT NULL DEFAULT 'campaign';

CREATE INDEX "rpg_campaign_messages_recipient_user_id_idx" ON "rpg_campaign_messages"("recipient_user_id");

ALTER TABLE "rpg_campaign_messages"
ADD CONSTRAINT "rpg_campaign_messages_recipient_user_id_fkey"
FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
