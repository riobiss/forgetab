-- CreateTable
CREATE TABLE "rpg_attribute_templates" (
    "id" TEXT NOT NULL,
    "rpg_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rpg_attribute_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rpg_characters" (
    "id" TEXT NOT NULL,
    "rpg_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "attributes" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rpg_characters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rpg_attribute_templates_rpg_id_key_key" ON "rpg_attribute_templates"("rpg_id", "key");

-- CreateIndex
CREATE INDEX "rpg_attribute_templates_rpg_id_idx" ON "rpg_attribute_templates"("rpg_id");

-- CreateIndex
CREATE INDEX "rpg_characters_rpg_id_idx" ON "rpg_characters"("rpg_id");

-- AddForeignKey
ALTER TABLE "rpg_attribute_templates" ADD CONSTRAINT "rpg_attribute_templates_rpg_id_fkey" FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rpg_characters" ADD CONSTRAINT "rpg_characters_rpg_id_fkey" FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
