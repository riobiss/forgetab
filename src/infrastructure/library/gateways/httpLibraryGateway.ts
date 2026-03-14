import type { LibraryGateway } from "@/application/library/contracts/LibraryGateway"
import type {
  ClassOptionDto,
  LibraryBookDto,
  LibrarySectionDto,
  RaceOptionDto,
  RpgUserOptionDto,
} from "@/application/library/types"

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string }
  if (!response.ok) {
    throw new Error(payload.message ?? "Erro na requisicao.")
  }
  return payload
}

export const httpLibraryGateway: LibraryGateway = {
  async fetchSections(rpgId) {
    const payload = await parseJson<{ sections?: LibrarySectionDto[]; canManage?: boolean }>(
      await fetch(`/api/rpg/${rpgId}/library/sections`),
    )
    return { sections: payload.sections ?? [], canManage: Boolean(payload.canManage) }
  },

  async createSection(rpgId, payload) {
    const result = await parseJson<{ section?: LibrarySectionDto }>(
      await fetch(`/api/rpg/${rpgId}/library/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    )
    if (!result.section) throw new Error("Nao foi possivel salvar a secao.")
    return result.section
  },

  async updateSection(rpgId, sectionId, payload) {
    const result = await parseJson<{ section?: LibrarySectionDto }>(
      await fetch(`/api/rpg/${rpgId}/library/sections/${sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    )
    if (!result.section) throw new Error("Nao foi possivel salvar a secao.")
    return result.section
  },

  async deleteSection(rpgId, sectionId) {
    await parseJson<{ message?: string }>(
      await fetch(`/api/rpg/${rpgId}/library/sections/${sectionId}`, {
        method: "DELETE",
      }),
    )
  },

  async fetchSection(rpgId, sectionId) {
    const payload = await parseJson<{ section?: LibrarySectionDto; canManage?: boolean }>(
      await fetch(`/api/rpg/${rpgId}/library/sections/${sectionId}`),
    )
    if (!payload.section) throw new Error("Nao foi possivel carregar a secao.")
    return { section: payload.section, canManage: Boolean(payload.canManage) }
  },

  async fetchSectionBooks(rpgId, sectionId) {
    const payload = await parseJson<{ books?: LibraryBookDto[]; canManage?: boolean; canCreate?: boolean }>(
      await fetch(`/api/rpg/${rpgId}/library/sections/${sectionId}/books`),
    )
    return {
      books: payload.books ?? [],
      canManage: Boolean(payload.canManage),
      canCreate: payload.canCreate !== false,
    }
  },

  async fetchVisibilityOptions(rpgId) {
    const [membersPayload, racesPayload, classesPayload] = await Promise.all([
      parseJson<{ users?: RpgUserOptionDto[] }>(await fetch(`/api/rpg/${rpgId}/members`)),
      parseJson<{ races?: RaceOptionDto[] }>(await fetch(`/api/rpg/${rpgId}/races`)),
      parseJson<{ classes?: ClassOptionDto[] }>(await fetch(`/api/rpg/${rpgId}/classes`)),
    ])

    return {
      players: membersPayload.users ?? [],
      races: racesPayload.races ?? [],
      classes: classesPayload.classes ?? [],
    }
  },

  async fetchBook(rpgId, bookId) {
    const payload = await parseJson<{
      book?: LibraryBookDto
      canEdit?: boolean
      canManage?: boolean
    }>(await fetch(`/api/rpg/${rpgId}/library/books/${bookId}`))
    if (!payload.book) throw new Error("Nao foi possivel carregar livro.")
    return {
      book: payload.book,
      canEdit: Boolean(payload.canEdit),
      canManage: Boolean(payload.canManage),
    }
  },

  async createBook(rpgId, sectionId, payload) {
    const result = await parseJson<{ book?: LibraryBookDto }>(
      await fetch(`/api/rpg/${rpgId}/library/sections/${sectionId}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    )
    if (!result.book) throw new Error("Nao foi possivel salvar livro.")
    return result.book
  },

  async updateBook(rpgId, bookId, payload) {
    const result = await parseJson<{ book?: LibraryBookDto }>(
      await fetch(`/api/rpg/${rpgId}/library/books/${bookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    )
    if (!result.book) throw new Error("Nao foi possivel salvar livro.")
    return result.book
  },

  async deleteBook(rpgId, bookId) {
    await parseJson<{ message?: string }>(
      await fetch(`/api/rpg/${rpgId}/library/books/${bookId}`, {
        method: "DELETE",
      }),
    )
  },

  async uploadLibraryImage(file) {
    const formData = new FormData()
    formData.append("file", file)
    const result = await parseJson<{ url?: string }>(
      await fetch("/api/uploads/library-image", {
        method: "POST",
        body: formData,
      }),
    )
    if (!result.url) throw new Error("Nao foi possivel enviar a imagem.")
    return { url: result.url.trim() }
  },
}
