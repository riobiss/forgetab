DROP INDEX IF EXISTS "rpg_notes_rpg_id_user_id_updated_at_idx";
CREATE INDEX "rpg_notes_rpg_id_user_id_updated_at_id_idx"
ON "rpg_notes"("rpg_id", "user_id", "updated_at", "id");

DROP INDEX IF EXISTS "rpg_note_label_assignments_label_id_idx";
CREATE INDEX "rpg_note_label_assignments_label_id_note_id_idx"
ON "rpg_note_label_assignments"("label_id", "note_id");
