ALTER TABLE "rpgs"
ADD COLUMN IF NOT EXISTS "users_can_manage_own_xp" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "rpgs"
ADD COLUMN IF NOT EXISTS "allow_skill_point_distribution" BOOLEAN NOT NULL DEFAULT true;
