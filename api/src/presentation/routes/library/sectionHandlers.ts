import type { FastifyReply, FastifyRequest } from "fastify"
import {
  createLibrarySection,
  deleteLibrarySection,
  getLibrarySection,
  listLibrarySectionBooks,
  listLibrarySections,
  updateLibrarySection,
} from "@/application/library/use-cases/libraryApi"
import {
  parseJsonBody,
  requireUserId,
  writeError,
  writeJson,
} from "@api/presentation/http/fastifyJson"
import { libraryRouteDeps } from "./dependencies"
import type { RpgRouteParams, SectionRouteParams } from "./routeTypes"

export async function listLibrarySectionsHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) return auth.response

  try {
    const payload = await listLibrarySections(libraryRouteDeps, {
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
  if (!auth.ok) return auth.response

  try {
    const body = parseJsonBody(request.body)
    const payload = await createLibrarySection(libraryRouteDeps, {
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
  if (!auth.ok) return auth.response

  try {
    const payload = await getLibrarySection(libraryRouteDeps, {
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
  if (!auth.ok) return auth.response

  try {
    const body = parseJsonBody(request.body)
    const payload = await updateLibrarySection(libraryRouteDeps, {
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
  if (!auth.ok) return auth.response

  try {
    const payload = await deleteLibrarySection(libraryRouteDeps, {
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
  if (!auth.ok) return auth.response

  try {
    const payload = await listLibrarySectionBooks(libraryRouteDeps, {
      rpgId: request.params.rpgId,
      sectionId: request.params.sectionId,
      userId: auth.userId,
    })
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao listar livros.")
  }
}
