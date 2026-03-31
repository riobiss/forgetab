import {
  createLibraryBook,
  createLibrarySection,
  deleteLibraryBook,
  deleteLibrarySection,
  getLibraryBook,
  getLibrarySection,
  listLibrarySectionBooks,
  listLibrarySections,
  updateLibraryBook,
  updateLibrarySection,
} from "@/application/library/use-cases/libraryApi"
import { prismaLibraryRepository } from "@/infrastructure/library/repositories/prismaLibraryRepository"
import { legacyLibraryAccessService } from "@/infrastructure/library/services/legacyLibraryAccessService"
import { getUserIdFromRequest } from "@/backend/auth/requestAuth"
import { jsonResponse } from "@/backend/http/jsonResponse"
import { toErrorResponse } from "@/backend/shared/errors"

type RpgRouteParams = { rpgId: string }
type SectionRouteParams = { rpgId: string; sectionId: string }
type BookRouteParams = { rpgId: string; bookId: string }

const deps = {
  repository: prismaLibraryRepository,
  accessService: legacyLibraryAccessService,
}

async function requireUserId(request: Request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return {
      ok: false as const,
      response: jsonResponse({ message: "Usuario nao autenticado." }, { status: 401 }),
    }
  }

  return { ok: true as const, userId }
}

export async function listLibrarySectionsHandler(request: Request, params: RpgRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await listLibrarySections(deps, { rpgId: params.rpgId, userId: auth.userId })
    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao listar secoes.")
  }
}

export async function createLibrarySectionHandler(request: Request, params: RpgRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = await request.json()
    const payload = await createLibrarySection(deps, { rpgId: params.rpgId, userId: auth.userId, body })
    return jsonResponse(payload, { status: 201 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao criar secao.")
  }
}

export async function getLibrarySectionHandler(request: Request, params: SectionRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await getLibrarySection(deps, {
      rpgId: params.rpgId,
      sectionId: params.sectionId,
      userId: auth.userId,
    })
    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao buscar secao.")
  }
}

export async function updateLibrarySectionHandler(request: Request, params: SectionRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = await request.json()
    const payload = await updateLibrarySection(deps, {
      rpgId: params.rpgId,
      sectionId: params.sectionId,
      userId: auth.userId,
      body,
    })
    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar secao.")
  }
}

export async function deleteLibrarySectionHandler(request: Request, params: SectionRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await deleteLibrarySection(deps, {
      rpgId: params.rpgId,
      sectionId: params.sectionId,
      userId: auth.userId,
    })
    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao remover secao.")
  }
}

export async function listLibrarySectionBooksHandler(request: Request, params: SectionRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await listLibrarySectionBooks(deps, {
      rpgId: params.rpgId,
      sectionId: params.sectionId,
      userId: auth.userId,
    })
    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao listar livros.")
  }
}

export async function createLibraryBookHandler(request: Request, params: SectionRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = await request.json()
    const payload = await createLibraryBook(deps, {
      rpgId: params.rpgId,
      sectionId: params.sectionId,
      userId: auth.userId,
      body,
    })
    return jsonResponse(payload, { status: 201 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao criar livro.")
  }
}

export async function getLibraryBookHandler(request: Request, params: BookRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await getLibraryBook(deps, {
      rpgId: params.rpgId,
      bookId: params.bookId,
      userId: auth.userId,
    })
    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao buscar livro.")
  }
}

export async function updateLibraryBookHandler(request: Request, params: BookRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = await request.json()
    const payload = await updateLibraryBook(deps, {
      rpgId: params.rpgId,
      bookId: params.bookId,
      userId: auth.userId,
      body,
    })
    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar livro.")
  }
}

export async function deleteLibraryBookHandler(request: Request, params: BookRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await deleteLibraryBook(deps, {
      rpgId: params.rpgId,
      bookId: params.bookId,
      userId: auth.userId,
    })
    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao remover livro.")
  }
}
