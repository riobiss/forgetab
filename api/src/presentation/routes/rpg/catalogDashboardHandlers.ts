import type { FastifyReply, FastifyRequest } from "fastify"
import { loadRpgCatalogUseCase } from "@/application/rpg/catalog/use-cases/rpgCatalog"
import { loadRpgDashboard } from "@/application/rpg/dashboard/use-cases/loadRpgDashboard"
import { writeError, writeJson } from "@api/presentation/http/fastifyJson"
import { resolveOptionalUserId } from "./auth"
import { rpgRouteDeps } from "./dependencies"
import type { RpgRouteParams } from "./routeTypes"

export async function listRpgCatalogHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = await resolveOptionalUserId(request)

  try {
    const payload = await loadRpgCatalogUseCase(rpgRouteDeps.catalogRepository, { userId })
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao carregar catalogo de RPGs.")
  }
}

export async function getRpgDashboardHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  const userId = await resolveOptionalUserId(request)

  try {
    const payload = await loadRpgDashboard(
      rpgRouteDeps.dashboardRepository,
      rpgRouteDeps.dashboardAccessService,
      {
        rpgId: request.params.rpgId,
        userId,
      },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao carregar dashboard do RPG.")
  }
}
