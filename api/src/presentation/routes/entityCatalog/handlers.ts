import type { FastifyReply, FastifyRequest } from "fastify"
import type { CatalogEntityType } from "@/domain/entityCatalog/types"
import { loadEntityCatalogPageData } from "@/application/entityCatalog/use-cases/entityCatalog"
import { loadEntityCatalogDetailUseCase } from "@/application/entityCatalog/use-cases/loadEntityCatalogDetail"
import { prismaEntityCatalogDetailRepository } from "@/infrastructure/entityCatalog/repositories/prismaEntityCatalogDetailRepository"
import { prismaEntityCatalogRepository } from "@/infrastructure/entityCatalog/repositories/prismaEntityCatalogRepository"
import { entityCatalogDetailAccessService } from "@/infrastructure/entityCatalog/services/entityCatalogDetailAccessService"
import { getAuthPayloadFromFastifyRequest } from "@api/presentation/http/auth/requestAuth"
import { writeError, writeJson } from "@api/presentation/http/fastifyJson"

type EntityCatalogRouteParams = {
  rpgId: string
}

type ClassDetailRouteParams = EntityCatalogRouteParams & {
  classId: string
}

type RaceDetailRouteParams = EntityCatalogRouteParams & {
  raceKey: string
}

async function resolveUserId(request: FastifyRequest) {
  const authPayload = await getAuthPayloadFromFastifyRequest(request)
  return authPayload?.userId ?? null
}

async function loadCatalog(
  request: FastifyRequest<{ Params: EntityCatalogRouteParams }>,
  entityType: CatalogEntityType,
) {
  const userId = await resolveUserId(request)

  return loadEntityCatalogPageData(prismaEntityCatalogRepository, {
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

export async function getClassCatalogDetailHandler(
  request: FastifyRequest<{ Params: ClassDetailRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const userId = await resolveUserId(request)
    const payload = await loadEntityCatalogDetailUseCase(
      {
        repository: prismaEntityCatalogDetailRepository,
        accessService: entityCatalogDetailAccessService,
      },
      {
        rpgId: request.params.rpgId,
        classId: request.params.classId,
        userId,
        entityType: "class",
      },
    )

    if (!payload) {
      return writeJson(reply, 404, { message: "Classe nao encontrada." })
    }

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao carregar classe.")
  }
}

export async function getRaceCatalogDetailHandler(
  request: FastifyRequest<{ Params: RaceDetailRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const userId = await resolveUserId(request)
    const payload = await loadEntityCatalogDetailUseCase(
      {
        repository: prismaEntityCatalogDetailRepository,
        accessService: entityCatalogDetailAccessService,
      },
      {
        rpgId: request.params.rpgId,
        raceKey: request.params.raceKey,
        userId,
        entityType: "race",
      },
    )

    if (!payload) {
      return writeJson(reply, 404, { message: "Raca nao encontrada." })
    }

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao carregar raca.")
  }
}
