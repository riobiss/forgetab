import type { Prisma } from "../../../../generated/prisma/client.js"
import { createLibraryBookSchema, createLibrarySectionSchema } from "@/lib/validators/library"
import type { LibraryAccessService } from "@/application/library/ports/LibraryAccessService"
import type { LibraryRepository, ViewerCharacter } from "@/application/library/ports/LibraryRepository"
import { AppError } from "@/shared/errors/AppError"
import {
  normalizeDescription,
  normalizeTextList,
  parseStringList,
  wrapLibraryError,
} from "./shared"

type Dependencies = {
  repository: LibraryRepository
  accessService: LibraryAccessService
}

function ensureCanView(exists: boolean, canView: boolean) {
  if (!exists || !canView) throw new AppError("RPG nao encontrado.", 404)
}

function ensureCanManage(exists: boolean, canManage: boolean) {
  if (!exists) throw new AppError("RPG nao encontrado.", 404)
  if (!canManage) {
    throw new AppError("Voce nao pode editar a biblioteca deste RPG.", 403)
  }
}

function ensureCanViewSection(
  section: { visibility: "private" | "public" },
  canManage: boolean,
) {
  if (section.visibility === "private" && !canManage) {
    throw new AppError("Secao nao encontrada.", 404)
  }
}

function ensureCanManageSection(
  access: { exists: boolean; canManage: boolean },
  owner: { createdByUserId: string | null } | null,
  userId: string,
) {
  if (!access.exists) throw new AppError("RPG nao encontrado.", 404)
  if (!owner) throw new AppError("Secao nao encontrada.", 404)
  if (access.canManage) return
  if (owner.createdByUserId !== userId) {
    throw new AppError("Voce so pode editar ou remover secoes criadas por voce.", 403)
  }
}

function canViewLibraryBook(
  book: {
    createdByUserId?: string | null
    visibility: "private" | "public" | "unlisted"
    allowedCharacterIds: string[]
    allowedClassKeys: string[]
    allowedRaceKeys: string[]
  },
  userId: string,
  canManage: boolean,
  viewerCharacters: ViewerCharacter[],
  options?: { allowUnlisted?: boolean },
) {
  if (canManage) return true
  if (book.createdByUserId === userId) return true
  if (book.visibility === "public") return true
  if (book.visibility === "unlisted") return Boolean(options?.allowUnlisted)

  const allowedUsersOrCharacterIds = new Set(parseStringList(book.allowedCharacterIds))
  const allowedClassKeys = new Set(parseStringList(book.allowedClassKeys))
  const allowedRaceKeys = new Set(parseStringList(book.allowedRaceKeys))

  if (
    allowedUsersOrCharacterIds.size === 0 &&
    allowedClassKeys.size === 0 &&
    allowedRaceKeys.size === 0
  ) {
    return false
  }

  if (allowedUsersOrCharacterIds.has(userId)) return true

  for (const character of viewerCharacters) {
    if (allowedUsersOrCharacterIds.has(character.id)) return true
    if (character.classKey && allowedClassKeys.has(character.classKey)) return true
    if (character.raceKey && allowedRaceKeys.has(character.raceKey)) return true
  }

  return false
}

function parseLibraryBookBody(body: unknown) {
  const parsed = createLibraryBookSchema.safeParse(body)
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message ?? "Dados invalidos.", 400)
  }
  return parsed.data
}

function toBookInput(data: ReturnType<typeof parseLibraryBookBody>) {
  return {
    title: data.title.trim(),
    description: normalizeDescription(data.description),
    content: JSON.stringify(
      data.content ?? { type: "doc", content: [] as unknown[] },
    ) as unknown as Prisma.JsonValue,
    visibility: data.visibility,
    allowedCharacterIds: normalizeTextList(data.allowedCharacterIds),
    allowedClassKeys: normalizeTextList(data.allowedClassKeys),
    allowedRaceKeys: normalizeTextList(data.allowedRaceKeys),
  }
}

export async function listLibrarySections(
  deps: Dependencies,
  params: { rpgId: string; userId: string },
) {
  try {
    const access = await deps.accessService.getRpgAccess(params.rpgId, params.userId)
    ensureCanView(access.exists, access.canView)
    const sections = await deps.repository.listSections(params.rpgId)
    return {
      sections: (access.canManage
        ? sections
        : sections.filter((section) => section.visibility === "public")).map((section) => ({
          ...section,
          canEdit: access.canManage || section.createdByUserId === params.userId,
          canDelete: access.canManage || section.createdByUserId === params.userId,
        })),
      canManage: access.canManage,
    }
  } catch (error) {
    wrapLibraryError(error, "Erro interno ao listar secoes.")
  }
}

export async function createLibrarySection(
  deps: Dependencies,
  params: { rpgId: string; userId: string; body: unknown },
) {
  try {
    const access = await deps.accessService.getRpgAccess(params.rpgId, params.userId)
    ensureCanView(access.exists, access.canView)
    const parsed = createLibrarySectionSchema.safeParse(params.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Dados invalidos.", 400)
    }
    const section = await deps.repository.createSection({
      rpgId: params.rpgId,
      userId: params.userId,
      title: parsed.data.title.trim(),
      description: normalizeDescription(parsed.data.description),
      visibility: parsed.data.visibility,
    })
    return { section }
  } catch (error) {
    wrapLibraryError(error, "Erro interno ao criar secao.")
  }
}

export async function getLibrarySection(
  deps: Dependencies,
  params: { rpgId: string; sectionId: string; userId: string },
) {
  try {
    const access = await deps.accessService.getRpgAccess(params.rpgId, params.userId)
    ensureCanView(access.exists, access.canView)
    const section = await deps.repository.findSection(params.rpgId, params.sectionId)
    if (!section) throw new AppError("Secao nao encontrada.", 404)
    ensureCanViewSection(section, access.canManage)
    return {
      section: {
        ...section,
        canEdit: access.canManage || section.createdByUserId === params.userId,
        canDelete: access.canManage || section.createdByUserId === params.userId,
      },
      canManage: access.canManage,
    }
  } catch (error) {
    wrapLibraryError(error, "Erro interno ao buscar secao.")
  }
}

export async function updateLibrarySection(
  deps: Dependencies,
  params: { rpgId: string; sectionId: string; userId: string; body: unknown },
) {
  try {
    const access = await deps.accessService.getRpgAccess(params.rpgId, params.userId)
    const owner = await deps.repository.findSectionOwner({
      rpgId: params.rpgId,
      sectionId: params.sectionId,
    })
    ensureCanManageSection(access, owner, params.userId)
    const parsed = createLibrarySectionSchema.safeParse(params.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Dados invalidos.", 400)
    }
    const section = await deps.repository.updateSection({
      rpgId: params.rpgId,
      sectionId: params.sectionId,
      title: parsed.data.title.trim(),
      description: normalizeDescription(parsed.data.description),
      visibility: parsed.data.visibility,
    })
    if (!section) throw new AppError("Secao nao encontrada.", 404)
    return { section }
  } catch (error) {
    wrapLibraryError(error, "Erro interno ao atualizar secao.")
  }
}

export async function deleteLibrarySection(
  deps: Dependencies,
  params: { rpgId: string; sectionId: string; userId: string },
) {
  try {
    const access = await deps.accessService.getRpgAccess(params.rpgId, params.userId)
    const owner = await deps.repository.findSectionOwner({
      rpgId: params.rpgId,
      sectionId: params.sectionId,
    })
    ensureCanManageSection(access, owner, params.userId)
    const deleted = await deps.repository.deleteSection(params.rpgId, params.sectionId)
    if (!deleted) throw new AppError("Secao nao encontrada.", 404)
    return { message: "Secao removida com sucesso." }
  } catch (error) {
    wrapLibraryError(error, "Erro interno ao remover secao.")
  }
}

export async function listLibrarySectionBooks(
  deps: Dependencies,
  params: { rpgId: string; sectionId: string; userId: string },
) {
  try {
    const access = await deps.accessService.getRpgAccess(params.rpgId, params.userId)
    ensureCanView(access.exists, access.canView)
    const section = await deps.repository.findSection(params.rpgId, params.sectionId)
    if (!section) throw new AppError("Secao nao encontrada.", 404)
    ensureCanViewSection(section, access.canManage)
    const books = await deps.repository.listBooks(params.rpgId, params.sectionId)
    const viewerCharacters = access.canManage
      ? []
      : await deps.repository.getViewerCharacters(params.rpgId, params.userId)

    return {
      books: books
        .filter((book) =>
          canViewLibraryBook(book, params.userId, access.canManage, viewerCharacters),
        )
        .map((book) => ({ ...book, canEdit: book.createdByUserId === params.userId })),
      canManage: access.canManage,
    }
  } catch (error) {
    wrapLibraryError(error, "Erro interno ao listar livros.")
  }
}

export async function createLibraryBook(
  deps: Dependencies,
  params: { rpgId: string; sectionId: string; userId: string; body: unknown },
) {
  try {
    const access = await deps.accessService.getRpgAccess(params.rpgId, params.userId)
    ensureCanManage(access.exists, access.canManage)
    const section = await deps.repository.findSection(params.rpgId, params.sectionId)
    if (!section) throw new AppError("Secao nao encontrada.", 404)
    const book = await deps.repository.createBook({
      rpgId: params.rpgId,
      sectionId: params.sectionId,
      userId: params.userId,
      ...toBookInput(parseLibraryBookBody(params.body)),
    })
    await deps.repository.touchSection(params.sectionId)
    return { book }
  } catch (error) {
    wrapLibraryError(error, "Erro interno ao criar livro.")
  }
}

export async function getLibraryBook(
  deps: Dependencies,
  params: { rpgId: string; bookId: string; userId: string },
) {
  try {
    const access = await deps.accessService.getRpgAccess(params.rpgId, params.userId)
    ensureCanView(access.exists, access.canView)
    const book = await deps.repository.findBook(params.rpgId, params.bookId)
    if (!book) throw new AppError("Livro nao encontrado.", 404)
    const viewerCharacters = access.canManage
      ? []
      : await deps.repository.getViewerCharacters(params.rpgId, params.userId)
    if (
      !canViewLibraryBook(book, params.userId, access.canManage, viewerCharacters, {
        allowUnlisted: true,
      })
    ) {
      throw new AppError("Livro nao encontrado.", 404)
    }
    return { book, canManage: access.canManage, canEdit: book.createdByUserId === params.userId }
  } catch (error) {
    wrapLibraryError(error, "Erro interno ao buscar livro.")
  }
}

export async function updateLibraryBook(
  deps: Dependencies,
  params: { rpgId: string; bookId: string; userId: string; body: unknown },
) {
  try {
    const access = await deps.accessService.getRpgAccess(params.rpgId, params.userId)
    ensureCanManage(access.exists, access.canManage)
    const owner = await deps.repository.findBookOwner({ rpgId: params.rpgId, bookId: params.bookId })
    if (!owner) throw new AppError("Livro nao encontrado.", 404)
    if (owner.createdByUserId !== params.userId) {
      throw new AppError("Apenas o autor pode editar este livro.", 403)
    }
    const book = await deps.repository.updateBook({
      rpgId: params.rpgId,
      bookId: params.bookId,
      ...toBookInput(parseLibraryBookBody(params.body)),
    })
    if (!book) throw new AppError("Livro nao encontrado.", 404)
    await deps.repository.touchSection(book.sectionId)
    return { book }
  } catch (error) {
    wrapLibraryError(error, "Erro interno ao atualizar livro.")
  }
}

export async function deleteLibraryBook(
  deps: Dependencies,
  params: { rpgId: string; bookId: string; userId: string },
) {
  try {
    const access = await deps.accessService.getRpgAccess(params.rpgId, params.userId)
    ensureCanManage(access.exists, access.canManage)
    const owner = await deps.repository.findBookOwner({ rpgId: params.rpgId, bookId: params.bookId })
    if (!owner) throw new AppError("Livro nao encontrado.", 404)
    if (owner.createdByUserId !== params.userId) {
      throw new AppError("Apenas o autor pode remover este livro.", 403)
    }
    const deleted = await deps.repository.deleteBook(params.rpgId, params.bookId)
    if (!deleted) throw new AppError("Livro nao encontrado.", 404)
    await deps.repository.touchSection(deleted.sectionId)
    return { message: "Livro removido com sucesso." }
  } catch (error) {
    wrapLibraryError(error, "Erro interno ao remover livro.")
  }
}
