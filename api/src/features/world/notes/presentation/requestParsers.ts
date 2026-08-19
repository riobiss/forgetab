import { AppError } from "@/features/shared/application/errors/AppError"
import type { SaveNoteInput } from "@/features/world/notes/application/types"

export function parseSaveNoteRequest(body: unknown): SaveNoteInput {
  if (!body || typeof body !== "object") {
    throw new AppError("Dados da nota invalidos.", 400)
  }

  const value = body as Record<string, unknown>
  return {
    title: typeof value.title === "string" ? value.title : "",
    content: typeof value.content === "string" ? value.content : "",
    labelIds: Array.isArray(value.labelIds)
      ? [
          ...new Set(
            value.labelIds.filter((id): id is string => typeof id === "string")
          )
        ]
      : [],
    clientId: typeof value.clientId === "string" ? value.clientId : null,
    baseRevision:
      typeof value.baseRevision === "number" &&
      Number.isInteger(value.baseRevision) &&
      value.baseRevision >= 0
        ? value.baseRevision
        : null
  }
}

export function parseNoteLabelRequest(body: unknown) {
  if (!body || typeof body !== "object") {
    throw new AppError("Dados do marcador invalidos.", 400)
  }
  const value = body as Record<string, unknown>
  return typeof value.name === "string" ? value.name : ""
}

export function parseNotesLimit(value?: string) {
  if (value === undefined) return undefined
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}
