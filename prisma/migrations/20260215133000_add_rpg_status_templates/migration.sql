-- CreateTable
CREATE TABLE "rpg_status_templates" (
    "id" TEXT NOT NULL,
    "rpg_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rpg_status_templates_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "rpg_characters"
ADD COLUMN "statuses" JSONB NOT NULL DEFAULT '{}'::jsonb;

-- CreateIndex
CREATE UNIQUE INDEX "rpg_status_templates_rpg_id_key_key" ON "rpg_status_templates"("rpg_id", "key");

-- CreateIndex
CREATE INDEX "rpg_status_templates_rpg_id_idx" ON "rpg_status_templates"("rpg_id");

-- AddForeignKey
ALTER TABLE "rpg_status_templates" ADD CONSTRAINT "rpg_status_templates_rpg_id_fkey" FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

