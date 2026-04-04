CREATE TYPE "public"."RpgMemberRole" AS ENUM ('member', 'moderator');

ALTER TABLE "rpg_members"
ADD COLUMN "role" "public"."RpgMemberRole" NOT NULL DEFAULT 'member';
