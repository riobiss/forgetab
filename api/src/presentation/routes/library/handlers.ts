import type { FastifyReply, FastifyRequest } from "fastify"
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
import {
  parseJsonBody,
  requireUserId,
  writeError,
  writeJson,
} from "@api/presentation/http/fastifyJson"

type RpgRouteParams = { rpgId: string }
type SectionRouteParams = { rpgId: string; sectionId: string }
type BookRouteParams = { rpgId: string; bookId: string }

const deps = {
  repository: prismaLibraryRepository,
  accessService: legacyLibraryAccessService,
}

export async function listLibrarySectionsHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await listLibrarySections(deps, {
      rpgId: request.params.rpgId,
      userId: auth.userId,
    })
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao listar secoes.")
  }
}

export async function createLibrarySectionHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = parseJsonBody(request.body)
    const payload = await createLibrarySection(deps, {
      rpgId: request.params.rpgId,
      userId: auth.userId,
      body,
    })
    return writeJson(reply, 201, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao criar secao.")
  }
}

export async function getLibrarySectionHandler(
  request: FastifyRequest<{ Params: SectionRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await getLibrarySection(deps, {
      rpgId: request.params.rpgId,
      sectionId: request.params.sectionId,
      userId: auth.userId,
    })
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao buscar secao.")
  }
}

export async function updateLibrarySectionHandler(
  request: FastifyRequest<{ Params: SectionRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = parseJsonBody(request.body)
    const payload = await updateLibrarySection(deps, {
      rpgId: request.params.rpgId,
      sectionId: request.params.sectionId,
      userId: auth.userId,
      body,
    })
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao atualizar secao.")
  }
}

export async function deleteLibrarySectionHandler(
  request: FastifyRequest<{ Params: SectionRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await deleteLibrarySection(deps, {
      rpgId: request.params.rpgId,
      sectionId: request.params.sectionId,
      userId: auth.userId,
    })
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao remover secao.")
  }
}

export async function listLibrarySectionBooksHandler(
  request: FastifyRequest<{ Params: SectionRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await listLibrarySectionBooks(deps, {
      rpgId: request.params.rpgId,
      sectionId: request.params.sectionId,
      userId: auth.userId,
    })
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao listar livros.")
  }
}

export async function createLibraryBookHandler(
  request: FastifyRequest<{ Params: SectionRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = parseJsonBody(request.body)
    const payload = await createLibraryBook(deps, {
      rpgId: request.params.rpgId,
      sectionId: request.params.sectionId,
      userId: auth.userId,
      body,
    })
    return writeJson(reply, 201, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao criar livro.")
  }
}

export async function getLibraryBookHandler(
  request: FastifyRequest<{ Params: BookRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await getLibraryBook(deps, {
      rpgId: request.params.rpgId,
      bookId: request.params.bookId,
      userId: auth.userId,
    })
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao buscar livro.")
  }
}

export async function updateLibraryBookHandler(
  request: FastifyRequest<{ Params: BookRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = parseJsonBody(request.body)
    const payload = await updateLibraryBook(deps, {
      rpgId: request.params.rpgId,
      bookId: request.params.bookId,
      userId: auth.userId,
      body,
    })
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao atualizar livro.")
  }
}

export async function deleteLibraryBookHandler(
  request: FastifyRequest<{ Params: BookRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await deleteLibraryBook(deps, {
      rpgId: request.params.rpgId,
      bookId: request.params.bookId,
      userId: auth.userId,
    })
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao remover livro.")
  }
}
