CREATE TABLE "rpg_note_labels" (
    "id" TEXT NOT NULL,
    "rpg_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rpg_note_labels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rpg_note_label_assignments" (
    "note_id" TEXT NOT NULL,
    "label_id" TEXT NOT NULL,

    CONSTRAINT "rpg_note_label_assignments_pkey" PRIMARY KEY ("note_id", "label_id")
);

CREATE UNIQUE INDEX "rpg_note_labels_rpg_id_user_id_name_key"
ON "rpg_note_labels"("rpg_id", "user_id", "name");

CREATE INDEX "rpg_note_labels_rpg_id_user_id_idx"
ON "rpg_note_labels"("rpg_id", "user_id");

CREATE INDEX "rpg_note_label_assignments_label_id_idx"
ON "rpg_note_label_assignments"("label_id");

ALTER TABLE "rpg_note_labels"
ADD CONSTRAINT "rpg_note_labels_rpg_id_fkey"
FOREIGN KEY ("rpg_id") REFERENCES "rpgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rpg_note_labels"
ADD CONSTRAINT "rpg_note_labels_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rpg_note_label_assignments"
ADD CONSTRAINT "rpg_note_label_assignments_note_id_fkey"
FOREIGN KEY ("note_id") REFERENCES "rpg_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rpg_note_label_assignments"
ADD CONSTRAINT "rpg_note_label_assignments_label_id_fkey"
FOREIGN KEY ("label_id") REFERENCES "rpg_note_labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
