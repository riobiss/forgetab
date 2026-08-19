import type { NoteLabelsGateway } from "@/features/world/notes/application/contracts/NotesGateway"
import type { NoteLabel } from "@/features/world/notes/domain/Note"

export interface NoteLabelsService {
  list(rpgId: string): Promise<NoteLabel[]>
  create(rpgId: string, name: string): Promise<NoteLabel>
  rename(rpgId: string, labelId: string, name: string): Promise<NoteLabel>
  delete(rpgId: string, labelId: string): Promise<void>
}

export function createNoteLabelsService(
  gateway: NoteLabelsGateway
): NoteLabelsService {
  return {
    list: (rpgId) => gateway.listLabels(rpgId),
    create: (rpgId, name) => gateway.createLabel(rpgId, name),
    rename: (rpgId, labelId, name) => gateway.updateLabel(rpgId, labelId, name),
    delete: (rpgId, labelId) => gateway.deleteLabel(rpgId, labelId)
  }
}
