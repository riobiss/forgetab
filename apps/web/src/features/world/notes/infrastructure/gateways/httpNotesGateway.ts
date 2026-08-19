import type {
  NotesFeatureGateway,
  NotesPage
} from "../../application/contracts/NotesGateway"
import type { Note, NoteLabel } from "../../domain/Note"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { parseApiResponse } from "@/features/http/infrastructure/parseApiResponse"

const notesPath = (rpgId: string, noteId?: string) =>
  `/api/rpg/${encodeURIComponent(rpgId)}/notes${
    noteId ? `/${encodeURIComponent(noteId)}` : ""
  }`

const labelsPath = (rpgId: string, labelId?: string) =>
  `/api/rpg/${encodeURIComponent(rpgId)}/note-labels${
    labelId ? `/${encodeURIComponent(labelId)}` : ""
  }`

export const httpNotesGateway: NotesFeatureGateway = {
  async list(rpgId, options) {
    const searchParams = new URLSearchParams()
    if (options?.cursor) searchParams.set("cursor", options.cursor)
    if (options?.limit) searchParams.set("limit", String(options.limit))
    if (options?.labelId) searchParams.set("labelId", options.labelId)
    const query = searchParams.size ? `?${searchParams.toString()}` : ""
    const payload = await parseApiResponse<Partial<NotesPage>>(
      await apiFetch(`${notesPath(rpgId)}${query}`, { cache: "no-store" })
    )
    return {
      notes: payload.notes ?? [],
      nextCursor: payload.nextCursor ?? null
    }
  },

  async create(rpgId, input) {
    const payload = await parseApiResponse<{ note?: Note }>(
      await apiFetch(notesPath(rpgId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      })
    )
    if (!payload.note) throw new Error("Nao foi possivel salvar a nota.")
    return payload.note
  },

  async update(rpgId, noteId, input) {
    const payload = await parseApiResponse<{ note?: Note }>(
      await apiFetch(notesPath(rpgId, noteId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      })
    )
    if (!payload.note) throw new Error("Nao foi possivel atualizar a nota.")
    return payload.note
  },

  async delete(rpgId, noteId) {
    await parseApiResponse(
      await apiFetch(notesPath(rpgId, noteId), { method: "DELETE" })
    )
  },

  async listLabels(rpgId) {
    const payload = await parseApiResponse<{ labels?: NoteLabel[] }>(
      await apiFetch(labelsPath(rpgId), { cache: "no-store" })
    )
    return payload.labels ?? []
  },

  async createLabel(rpgId, name) {
    const payload = await parseApiResponse<{ label?: NoteLabel }>(
      await apiFetch(labelsPath(rpgId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      })
    )
    if (!payload.label) throw new Error("Nao foi possivel criar o marcador.")
    return payload.label
  },

  async updateLabel(rpgId, labelId, name) {
    const payload = await parseApiResponse<{ label?: NoteLabel }>(
      await apiFetch(labelsPath(rpgId, labelId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      })
    )
    if (!payload.label) throw new Error("Nao foi possivel editar o marcador.")
    return payload.label
  },

  async deleteLabel(rpgId, labelId) {
    await parseApiResponse(
      await apiFetch(labelsPath(rpgId, labelId), { method: "DELETE" })
    )
  }
}
