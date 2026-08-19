export {
  NOTE_CONTENT_MAX_LENGTH,
  NOTE_LABEL_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH
} from "@forgetab/world-contracts/notes"

export type Note = {
  id: string
  rpgId: string
  userId: string
  clientId: string | null
  title: string
  content: string
  revision: number
  createdAt: Date
  updatedAt: Date
  labels: NoteLabel[]
}

export type NoteLabel = {
  id: string
  name: string
}
