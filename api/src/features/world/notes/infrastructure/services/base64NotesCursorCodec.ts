import { AppError } from "@/features/shared/application/errors/AppError"
import type { NotesCursorCodec } from "@/features/world/notes/application/ports/NotesCursorCodec"

export const base64NotesCursorCodec: NotesCursorCodec = {
  decode(value) {
    try {
      const decoded = JSON.parse(
        Buffer.from(value, "base64url").toString("utf8")
      ) as Record<string, unknown>
      const updatedAt =
        typeof decoded.updatedAt === "string"
          ? new Date(decoded.updatedAt)
          : new Date(Number.NaN)
      if (
        typeof decoded.id !== "string" ||
        !decoded.id ||
        Number.isNaN(updatedAt.getTime())
      ) {
        throw new Error("invalid cursor")
      }
      return { updatedAt, id: decoded.id }
    } catch {
      throw new AppError("Cursor de notas invalido.", 400)
    }
  },

  encode(note) {
    return Buffer.from(
      JSON.stringify({ updatedAt: note.updatedAt.toISOString(), id: note.id }),
      "utf8"
    ).toString("base64url")
  }
}
