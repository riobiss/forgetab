import type { FastifyReply, FastifyRequest } from "fastify"
import {
  createLibraryBook,
  deleteLibraryBook,
  getLibraryBook,
  updateLibraryBook,
} from "@/application/library/use-cases/libraryApi"
import {
  parseJsonBody,
  requireUserId,
  writeError,
  writeJson,
} from "@api/presentation/http/fastifyJson"
import { libraryRouteDeps } from "./dependencies"
import type { BookRouteParams, SectionRouteParams } from "./routeTypes"

export async function createLibraryBookHandler(
  request: FastifyRequest<{ Params: SectionRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) return auth.response

  try {
    const body = parseJsonBody(request.body)
    const payload = await createLibraryBook(libraryRouteDeps, {
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
  if (!auth.ok) return auth.response

  try {
    const payload = await getLibraryBook(libraryRouteDeps, {
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
  if (!auth.ok) return auth.response

  try {
    const body = parseJsonBody(request.body)
    const payload = await updateLibraryBook(libraryRouteDeps, {
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
  if (!auth.ok) return auth.response

  try {
    const payload = await deleteLibraryBook(libraryRouteDeps, {
      rpgId: request.params.rpgId,
      bookId: request.params.bookId,
      userId: auth.userId,
    })
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao remover livro.")
  }
}
