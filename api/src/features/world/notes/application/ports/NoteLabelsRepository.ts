import type { NoteLabel } from "../../domain/Note"

export interface NoteLabelsRepository {
  listLabels(rpgId: string, userId: string): Promise<NoteLabel[]>
  createLabel(
    rpgId: string,
    userId: string,
    name: string
  ): Promise<NoteLabel | null>
  updateLabel(
    rpgId: string,
    userId: string,
    labelId: string,
    name: string
  ): Promise<NoteLabel | null>
  deleteLabel(rpgId: string, userId: string, labelId: string): Promise<boolean>
}
