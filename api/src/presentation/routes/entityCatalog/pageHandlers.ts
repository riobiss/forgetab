import type { FastifyReply, FastifyRequest } from "fastify"
import type { CatalogEntityType } from "@/domain/entityCatalog/types"
import { loadEntityCatalogPageData } from "@/application/entityCatalog/use-cases/entityCatalog"
import { writeError, writeJson } from "@api/presentation/http/fastifyJson"
import { resolveUserId } from "./auth"
import { entityCatalogRouteDeps } from "./dependencies"
import type { EntityCatalogRouteParams } from "./routeTypes"

async function loadCatalog(
  request: FastifyRequest<{ Params: EntityCatalogRouteParams }>,
  entityType: CatalogEntityType,
) {
  const userId = await resolveUserId(request)

  return loadEntityCatalogPageData(entityCatalogRouteDeps.repository, {
    rpgId: request.params.rpgId,
    userId,
    entityType,
  })
}

export async function getClassCatalogPageHandler(
  request: FastifyRequest<{ Params: EntityCatalogRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const payload = await loadCatalog(request, "class")
    if (!payload) {
      return writeJson(reply, 404, { message: "RPG nao encontrado." })
    }
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao carregar catalogo de classes.")
  }
}

export async function getRaceCatalogPageHandler(
  request: FastifyRequest<{ Params: EntityCatalogRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const payload = await loadCatalog(request, "race")
    if (!payload) {
      return writeJson(reply, 404, { message: "RPG nao encontrado." })
    }
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao carregar catalogo de racas.")
  }
}
