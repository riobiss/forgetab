CREATE TABLE "rpg_user_profiles" (
  "id" TEXT NOT NULL,
  "rpg_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "display_name" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "rpg_user_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rpg_user_profiles_rpg_id_user_id_key" ON "rpg_user_profiles"("rpg_id", "user_id");
CREATE INDEX "rpg_user_profiles_user_id_idx" ON "rpg_user_profiles"("user_id");

ALTER TABLE "rpg_user_profiles"
  ADD CONSTRAINT "rpg_user_profiles_rpg_id_fkey"
  FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rpg_user_profiles"
  ADD CONSTRAINT "rpg_user_profiles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
