ALTER TYPE "public"."BaseItemType" RENAME TO "BaseItemType_old";

CREATE TYPE "public"."BaseItemType" AS ENUM (
  'equipment',
  'consumable',
  'material',
  'tool',
  'quest',
  'special'
);

ALTER TABLE "baseitems"
ALTER COLUMN "type" TYPE "public"."BaseItemType"
USING (
  CASE
    WHEN "type"::text IN ('weapon', 'armor', 'accessory') THEN 'equipment'
    WHEN "type"::text = 'consumable' THEN 'consumable'
    WHEN "type"::text = 'material' THEN 'material'
    WHEN "type"::text = 'quest' THEN 'quest'
    ELSE 'special'
  END
)::"public"."BaseItemType";

DROP TYPE "public"."BaseItemType_old";
