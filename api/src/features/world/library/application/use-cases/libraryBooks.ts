import { AppError } from "@/features/shared/application/errors/AppError"
import type { LibraryAccessService } from "@/features/world/library/application/ports/LibraryAccessService"
import type { LibraryBookRepository } from "@/features/world/library/application/ports/LibraryRepository"
import { createLibraryBookSchema } from "@/lib/validators/library"
import {
  canViewLibraryBook,
  ensureCanManageOwnedResource,
  ensureCanViewLibrarySection,
  ensureCanViewRpg,
  normalizeDescription,
  normalizeTextList,
  wrapLibraryError,
} from "./shared"

type Dependencies = {
  repository: LibraryBookRepository
  accessService: LibraryAccessService
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
    content: JSON.stringify(data.content ?? { type: "doc", content: [] }),
    visibility: data.visibility,
    allowedCharacterIds: normalizeTextList(data.allowedCharacterIds),
    allowedClassKeys: normalizeTextList(data.allowedClassKeys),
    allowedRaceKeys: normalizeTextList(data.allowedRaceKeys),
  }
}

export async function listLibrarySectionBooks(
  deps: Dependencies,
  params: { rpgId: string; sectionId: string; userId: string },
) {
  try {
    const access = await deps.accessService.getRpgAccess(params.rpgId, params.userId)
    ensureCanViewRpg(access.exists, access.canView)
    const section = await deps.repository.findSection(params.rpgId, params.sectionId)
    if (!section) throw new AppError("Secao nao encontrada.", 404)
    ensureCanViewLibrarySection(section, params.userId, access.canManage)

    const books = await deps.repository.listBooks(params.rpgId, params.sectionId)
    const viewerCharacters = access.canManage
      ? []
      : await deps.repository.getViewerCharacters(params.rpgId, params.userId)

    return {
      books: books
        .filter((book) =>
          canViewLibraryBook(book, params.userId, access.canManage, viewerCharacters),
        )
        .map((book) => ({
          ...book,
          canEdit: access.canManage || book.createdByUserId === params.userId,
        })),
      canManage: access.canManage,
      canCreate: access.canView,
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
    ensureCanViewRpg(access.exists, access.canView)
    const section = await deps.repository.findSection(params.rpgId, params.sectionId)
    if (!section) throw new AppError("Secao nao encontrada.", 404)
    ensureCanViewLibrarySection(section, params.userId, access.canManage)

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
    ensureCanViewRpg(access.exists, access.canView)
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
    return {
      book,
      canManage: access.canManage,
      canEdit: access.canManage || book.createdByUserId === params.userId,
    }
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
    const owner = await deps.repository.findBookOwner({
      rpgId: params.rpgId,
      bookId: params.bookId,
    })
    ensureCanManageOwnedResource(access, owner, params.userId, "Livro")
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
    const owner = await deps.repository.findBookOwner({
      rpgId: params.rpgId,
      bookId: params.bookId,
    })
    ensureCanManageOwnedResource(access, owner, params.userId, "Livro")
    const deleted = await deps.repository.deleteBook(params.rpgId, params.bookId)
    if (!deleted) throw new AppError("Livro nao encontrado.", 404)
    await deps.repository.touchSection(deleted.sectionId)
    return { message: "Livro removido com sucesso." }
  } catch (error) {
    wrapLibraryError(error, "Erro interno ao remover livro.")
  }
}
