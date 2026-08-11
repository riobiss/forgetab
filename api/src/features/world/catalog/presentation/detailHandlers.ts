import type { FastifyReply, FastifyRequest } from "fastify"
import { loadEntityCatalogDetailUseCase } from "@/features/world/catalog/application/use-cases/loadEntityCatalogDetail"
import { writeError, writeJson } from "@/features/http/presentation/fastifyJson"
import { resolveUserId } from "./auth"
import { entityCatalogRouteDeps } from "./dependencies"
import type {
  ClassDetailRouteParams,
  RaceDetailRouteParams
} from "./routeTypes"

export async function getClassCatalogDetailHandler(
  request: FastifyRequest<{ Params: ClassDetailRouteParams }>,
  reply: FastifyReply
) {
  try {
    const userId = await resolveUserId(request)
    const payload = await loadEntityCatalogDetailUseCase(
      {
        repository: entityCatalogRouteDeps.detailRepository,
        abilityRepository: entityCatalogRouteDeps.abilityRepository,
        playerRepository: entityCatalogRouteDeps.playerRepository,
        purchaseRepository: entityCatalogRouteDeps.purchaseRepository,
        characterProgressionRepository:
          entityCatalogRouteDeps.characterProgressionRepository,
        accessService: entityCatalogRouteDeps.detailAccessService
      },
      {
        rpgId: request.params.rpgId,
        classId: request.params.classId,
        userId,
        entityType: "class"
      }
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
  reply: FastifyReply
) {
  try {
    const userId = await resolveUserId(request)
    const payload = await loadEntityCatalogDetailUseCase(
      {
        repository: entityCatalogRouteDeps.detailRepository,
        abilityRepository: entityCatalogRouteDeps.abilityRepository,
        playerRepository: entityCatalogRouteDeps.playerRepository,
        purchaseRepository: entityCatalogRouteDeps.purchaseRepository,
        characterProgressionRepository:
          entityCatalogRouteDeps.characterProgressionRepository,
        accessService: entityCatalogRouteDeps.detailAccessService
      },
      {
        rpgId: request.params.rpgId,
        raceKey: request.params.raceKey,
        userId,
        entityType: "race"
      }
    )

    if (!payload) {
      return writeJson(reply, 404, { message: "Raca nao encontrada." })
    }

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao carregar raca.")
  }
}
