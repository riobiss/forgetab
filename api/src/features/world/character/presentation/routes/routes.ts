import type { FastifyInstance, FastifyRequest } from "fastify"
import { registerFastifyRoute } from "@/fastifyRoute"

import {
  buyCharacterSkillHandler,
  createCharacterHandler,
  getCharacterDetailHandler,
  createCharacterInventoryHandler,
  deleteCharacterHandler,
  getCharacterByIdHandler,
  getCharactersDashboardHandler,
  getCharacterInventoryHandler,
  getNpcMonsterCharacterAbilitiesHandler,
  grantCharacterPointsHandler,
  grantCharacterXpHandler,
  listCharactersHandler,
  removeCharacterInventoryHandler,
  removeCharacterSkillHandler,
  removeNpcMonsterCharacterAbilityHandler,
  addNpcMonsterCharacterAbilityHandler,
  updateCharacterHandler,
  updateCharacterStatusCurrentHandler,
} from "@/features/world/character/presentation/handlers"

export function characterRoutes(app: FastifyInstance) {
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/characters",
    (request, reply) =>
      listCharactersHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/characters/dashboard",
    (request, reply) =>
      getCharactersDashboardHandler(
        request as FastifyRequest<{
          Params: { rpgId: string }
          Querystring: {
            type?: string
            modal?: string
            viewer?: string
            characterId?: string
          }
        }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/characters",
    (request, reply) =>
      createCharacterHandler(
        request as FastifyRequest<{ Params: { rpgId: string } }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/characters/:characterId",
    (request, reply) =>
      getCharacterByIdHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; characterId: string }
        }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/characters/:characterId/detail",
    (request, reply) =>
      getCharacterDetailHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; characterId: string }
        }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "patch",
    "/api/rpg/:rpgId/characters/:characterId",
    (request, reply) =>
      updateCharacterHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; characterId: string }
        }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/rpg/:rpgId/characters/:characterId",
    (request, reply) =>
      deleteCharacterHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; characterId: string }
        }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/characters/:characterId/inventory",
    (request, reply) =>
      getCharacterInventoryHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; characterId: string }
        }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/characters/:characterId/inventory",
    (_request, reply) => createCharacterInventoryHandler(reply),
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/rpg/:rpgId/characters/:characterId/inventory",
    (request, reply) =>
      removeCharacterInventoryHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; characterId: string }
        }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "patch",
    "/api/rpg/:rpgId/characters/:characterId/status-current",
    (request, reply) =>
      updateCharacterStatusCurrentHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; characterId: string }
        }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/characters/:characterId/abilities",
    (request, reply) =>
      getNpcMonsterCharacterAbilitiesHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; characterId: string }
        }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/characters/:characterId/abilities",
    (request, reply) =>
      addNpcMonsterCharacterAbilityHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; characterId: string }
        }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/rpg/:rpgId/characters/:characterId/abilities",
    (request, reply) =>
      removeNpcMonsterCharacterAbilityHandler(
        request as FastifyRequest<{
          Params: { rpgId: string; characterId: string }
        }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/characters/:id/grant-xp",
    (request, reply) =>
      grantCharacterXpHandler(
        request as FastifyRequest<{ Params: { id: string } }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/characters/:id/grant-points",
    (request, reply) =>
      grantCharacterPointsHandler(
        request as FastifyRequest<{ Params: { id: string } }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/characters/:id/buy-skill",
    (request, reply) =>
      buyCharacterSkillHandler(
        request as FastifyRequest<{ Params: { id: string } }>,
        reply,
      ),
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/characters/:id/buy-skill",
    (request, reply) =>
      removeCharacterSkillHandler(
        request as FastifyRequest<{ Params: { id: string } }>,
        reply,
      ),
  )
}
