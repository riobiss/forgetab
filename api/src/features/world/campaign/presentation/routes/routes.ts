import type { FastifyInstance, FastifyRequest } from "fastify"
import { registerFastifyRoute } from "@/fastifyRoute"
import {
  acceptRpgCampaignDeliveryOfferHandler,
  addRpgCampaignCombatCreaturesHandler,
  createRpgCampaignCombatHandler,
  createRpgCampaignCombatQueueHandler,
  createRpgCampaignHandler,
  createRpgCampaignMessageHandler,
  deleteRpgCampaignActionMessageHandler,
  deleteRpgCampaignHandler,
  endRpgCampaignHandler,
  getRpgCampaignRoomHandler,
  joinRpgCampaignCombatHandler,
  joinRpgCampaignHandler,
  leaveRpgCampaignHandler,
  listRpgCampaignMessagesHandler,
  listRpgCampaignsHandler,
  moveRpgCampaignCombatQueueEntryHandler,
  passRpgCampaignCombatTurnHandler,
  rollRpgCampaignDiceHandler,
  startRpgCampaignHandler
} from "@/features/world/campaign/presentation/handlers"
import type {
  CampaignCombatQueueRouteParams,
  CampaignCombatRouteParams,
  CampaignMessageRouteParams,
  CampaignRouteParams,
  RpgRouteParams
} from "@/features/world/campaign/presentation/routeTypes"

export function campaignRoutes(app: FastifyInstance) {
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/campaigns",
    (request, reply) =>
      listRpgCampaignsHandler(
        request as FastifyRequest<{ Params: RpgRouteParams }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/campaigns",
    (request, reply) =>
      createRpgCampaignHandler(
        request as FastifyRequest<{ Params: RpgRouteParams }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/campaigns/:campaignId/start",
    (request, reply) =>
      startRpgCampaignHandler(
        request as FastifyRequest<{ Params: CampaignRouteParams }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/campaigns/:campaignId/end",
    (request, reply) =>
      endRpgCampaignHandler(
        request as FastifyRequest<{ Params: CampaignRouteParams }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/rpg/:rpgId/campaigns/:campaignId",
    (request, reply) =>
      deleteRpgCampaignHandler(
        request as FastifyRequest<{ Params: CampaignRouteParams }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/campaigns/:campaignId/room",
    (request, reply) =>
      getRpgCampaignRoomHandler(
        request as FastifyRequest<{ Params: CampaignRouteParams }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/campaigns/:campaignId/join",
    (request, reply) =>
      joinRpgCampaignHandler(
        request as FastifyRequest<{ Params: CampaignRouteParams }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/campaigns/:campaignId/leave",
    (request, reply) =>
      leaveRpgCampaignHandler(
        request as FastifyRequest<{ Params: CampaignRouteParams }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "get",
    "/api/rpg/:rpgId/campaigns/:campaignId/messages",
    (request, reply) =>
      listRpgCampaignMessagesHandler(
        request as FastifyRequest<{ Params: CampaignRouteParams }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/campaigns/:campaignId/messages",
    (request, reply) =>
      createRpgCampaignMessageHandler(
        request as FastifyRequest<{ Params: CampaignRouteParams }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/campaigns/:campaignId/dice-roll",
    (request, reply) =>
      rollRpgCampaignDiceHandler(
        request as FastifyRequest<{ Params: CampaignRouteParams }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "delete",
    "/api/rpg/:rpgId/campaigns/:campaignId/messages/:messageId",
    (request, reply) =>
      deleteRpgCampaignActionMessageHandler(
        request as FastifyRequest<{ Params: CampaignMessageRouteParams }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/campaigns/:campaignId/messages/:messageId/accept-delivery",
    (request, reply) =>
      acceptRpgCampaignDeliveryOfferHandler(
        request as FastifyRequest<{ Params: CampaignMessageRouteParams }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/campaigns/:campaignId/combats",
    (request, reply) =>
      createRpgCampaignCombatHandler(
        request as FastifyRequest<{ Params: CampaignRouteParams }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/campaigns/:campaignId/combats/:combatId/join",
    (request, reply) =>
      joinRpgCampaignCombatHandler(
        request as FastifyRequest<{ Params: CampaignCombatRouteParams }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/campaigns/:campaignId/combats/:combatId/creatures",
    (request, reply) =>
      addRpgCampaignCombatCreaturesHandler(
        request as FastifyRequest<{ Params: CampaignCombatRouteParams }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/campaigns/:campaignId/combats/:combatId/queue",
    (request, reply) =>
      createRpgCampaignCombatQueueHandler(
        request as FastifyRequest<{ Params: CampaignCombatRouteParams }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "patch",
    "/api/rpg/:rpgId/campaigns/:campaignId/combats/:combatId/queue/:entryId",
    (request, reply) =>
      moveRpgCampaignCombatQueueEntryHandler(
        request as FastifyRequest<{ Params: CampaignCombatQueueRouteParams }>,
        reply
      )
  )
  registerFastifyRoute(
    app,
    "post",
    "/api/rpg/:rpgId/campaigns/:campaignId/combats/:combatId/pass",
    (request, reply) =>
      passRpgCampaignCombatTurnHandler(
        request as FastifyRequest<{ Params: CampaignCombatRouteParams }>,
        reply
      )
  )
}
