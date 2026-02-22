ALTER TABLE "rpgs"
ADD COLUMN "use_race_bonuses" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "rpgs"
ADD COLUMN "use_class_bonuses" BOOLEAN NOT NULL DEFAULT false;

UPDATE "rpgs"
SET
  "use_race_bonuses" = COALESCE("use_class_race_bonuses", false),
  "use_class_bonuses" = COALESCE("use_class_race_bonuses", false)
WHERE
  "use_race_bonuses" = false
  AND "use_class_bonuses" = false;
