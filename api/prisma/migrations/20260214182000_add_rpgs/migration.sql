-- CreateEnum
CREATE TYPE "public"."RpgVisibility" AS ENUM ('private', 'public');

-- CreateTable
CREATE TABLE "rpgs" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "visibility" "public"."RpgVisibility" NOT NULL DEFAULT 'private',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rpgs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rpgs_owner_id_idx" ON "rpgs"("owner_id");

-- AddForeignKey
ALTER TABLE "rpgs" ADD CONSTRAINT "rpgs_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
