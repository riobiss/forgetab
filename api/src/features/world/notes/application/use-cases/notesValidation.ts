import {
  NOTES_DEFAULT_PAGE_SIZE,
  NOTES_MAX_PAGE_SIZE
} from "@forgetab/world-contracts/notes"
import { AppError } from "@/features/shared/application/errors/AppError"
import type { SaveNoteInput } from "../types"
import {
  NOTE_CONTENT_MAX_LENGTH,
  NOTE_LABEL_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH
} from "../../domain/Note"

export function normalizeNoteInput(value: SaveNoteInput): SaveNoteInput {
  const title = value.title.trim()
  const content = value.content
  const labelIds = [...new Set(value.labelIds)]
  const clientId =
    value.clientId && value.clientId.trim()
      ? value.clientId.trim().slice(0, 160)
      : null
  const baseRevision =
    Number.isInteger(value.baseRevision) &&
    value.baseRevision !== null &&
    value.baseRevision >= 0
      ? value.baseRevision
      : null

  if (!title && !content.trim()) {
    throw new AppError("Informe um titulo ou conteudo para a nota.", 400)
  }
  if (title.length > NOTE_TITLE_MAX_LENGTH) {
    throw new AppError(
      `O titulo deve ter no maximo ${NOTE_TITLE_MAX_LENGTH} caracteres.`,
      400
    )
  }
  if (content.length > NOTE_CONTENT_MAX_LENGTH) {
    throw new AppError(
      `A nota deve ter no maximo ${NOTE_CONTENT_MAX_LENGTH} caracteres.`,
      400
    )
  }

  return { title, content, labelIds, clientId, baseRevision }
}

export function normalizeLabelName(value: string) {
  const name = value.trim()
  if (!name) throw new AppError("Informe o nome do marcador.", 400)
  if (name.length > NOTE_LABEL_MAX_LENGTH) {
    throw new AppError(
      `O marcador deve ter no maximo ${NOTE_LABEL_MAX_LENGTH} caracteres.`,
      400
    )
  }
  return name
}

export function normalizePageSize(value?: number) {
  if (!Number.isInteger(value) || !value || value <= 0) {
    return NOTES_DEFAULT_PAGE_SIZE
  }
  return Math.min(value, NOTES_MAX_PAGE_SIZE)
}
