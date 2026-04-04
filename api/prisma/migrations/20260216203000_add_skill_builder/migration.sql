CREATE TABLE "skills" (
  "id" TEXT NOT NULL,
  "owner_id" TEXT NOT NULL,
  "rpg_id" TEXT,
  "rpg_scope" TEXT NOT NULL DEFAULT 'global',
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "category" TEXT,
  "type" TEXT,
  "description" TEXT,
  "current_level" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "skills_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "skills_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "skills_rpg_id_fkey" FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "skill_levels" (
  "id" TEXT NOT NULL,
  "skill_id" TEXT NOT NULL,
  "level_number" INTEGER NOT NULL,
  "level_required" INTEGER NOT NULL DEFAULT 1,
  "summary" TEXT,
  "stats" JSONB,
  "cost" JSONB,
  "target" JSONB,
  "area" JSONB,
  "scaling" JSONB,
  "requirement" JSONB,
  "effects" JSONB NOT NULL DEFAULT '[]',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "skill_levels_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "skill_levels_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "skill_class_links" (
  "skill_id" TEXT NOT NULL,
  "class_template_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "skill_class_links_pkey" PRIMARY KEY ("skill_id","class_template_id"),
  CONSTRAINT "skill_class_links_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "skill_class_links_class_template_id_fkey" FOREIGN KEY ("class_template_id") REFERENCES "rpg_class_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "skill_race_links" (
  "skill_id" TEXT NOT NULL,
  "race_template_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "skill_race_links_pkey" PRIMARY KEY ("skill_id","race_template_id"),
  CONSTRAINT "skill_race_links_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "skill_race_links_race_template_id_fkey" FOREIGN KEY ("race_template_id") REFERENCES "rpg_race_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "skills_owner_id_rpg_scope_slug_key" ON "skills"("owner_id", "rpg_scope", "slug");
CREATE INDEX "skills_owner_id_rpg_id_idx" ON "skills"("owner_id", "rpg_id");
CREATE UNIQUE INDEX "skill_levels_skill_id_level_number_key" ON "skill_levels"("skill_id", "level_number");
CREATE INDEX "skill_levels_skill_id_level_required_idx" ON "skill_levels"("skill_id", "level_required");
CREATE INDEX "skill_class_links_class_template_id_idx" ON "skill_class_links"("class_template_id");
CREATE INDEX "skill_race_links_race_template_id_idx" ON "skill_race_links"("race_template_id");
