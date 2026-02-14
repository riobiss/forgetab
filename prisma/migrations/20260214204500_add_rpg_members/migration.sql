-- CreateEnum
CREATE TYPE "public"."RpgMemberStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateTable
CREATE TABLE "rpg_members" (
    "id" TEXT NOT NULL,
    "rpg_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "public"."RpgMemberStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "rpg_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rpg_members_rpg_id_user_id_key" ON "rpg_members"("rpg_id", "user_id");

-- CreateIndex
CREATE INDEX "rpg_members_rpg_id_idx" ON "rpg_members"("rpg_id");

-- CreateIndex
CREATE INDEX "rpg_members_user_id_idx" ON "rpg_members"("user_id");

-- AddForeignKey
ALTER TABLE "rpg_members" ADD CONSTRAINT "rpg_members_rpg_id_fkey" FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rpg_members" ADD CONSTRAINT "rpg_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
