import type { FastifyInstance, FastifyReply, FastifyRequest, RouteGenericInterface } from "fastify"
import { appendCorsHeaders, resolveAllowedOrigin } from "@api/presentation/http/cors"
import {
  healthHandler,
  loginHandler,
  logoutHandler,
  registerHandler,
} from "@api/presentation/routes/auth/handlers"
import {
  buyCharacterSkillHandler,
  createCharacterHandler,
  createCharacterInventoryHandler,
  deleteCharacterHandler,
  getCharacterByIdHandler,
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
} from "@api/presentation/routes/characters/handlers"
import {
  createItemHandler,
  deleteItemHandler,
  getItemByIdHandler,
  getItemsDashboardHandler,
  giveItemHandler,
  listItemsHandler,
  updateItemHandler,
} from "@api/presentation/routes/items/handlers"
import {
  createLibraryBookHandler,
  createLibrarySectionHandler,
  deleteLibraryBookHandler,
  deleteLibrarySectionHandler,
  getLibraryBookHandler,
  getLibrarySectionHandler,
  listLibrarySectionBooksHandler,
  listLibrarySectionsHandler,
  updateLibraryBookHandler,
  updateLibrarySectionHandler,
} from "@api/presentation/routes/library/handlers"
import {
  createRpgHandler,
  deleteRpgHandler,
  getRpgByIdHandler,
  updateRpgHandler,
} from "@api/presentation/routes/rpg/handlers"
import {
  getAttributeTemplatesHandler,
  getCharacteristicTemplatesHandler,
  getClassTemplatesHandler,
  getIdentityTemplatesHandler,
  getRaceTemplatesHandler,
  getSkillTemplatesHandler,
  getStatusTemplatesHandler,
  updateAttributeTemplatesHandler,
  updateCharacteristicTemplatesHandler,
  updateClassTemplatesHandler,
  updateIdentityTemplatesHandler,
  updateRaceTemplatesHandler,
  updateSkillTemplatesHandler,
  updateStatusTemplatesHandler,
} from "@api/presentation/routes/rpgConfig/handlers"
import {
  createRpgMapHandler,
  createRpgMapMarkerGroupHandler,
  createRpgMapSectionHandler,
  deleteRpgMapHandler,
  deleteRpgMapMarkerGroupHandler,
  deleteRpgMapSectionHandler,
  getRpgMapDetailHandler,
  listRpgMapsHandler,
  reorderRpgMapSectionHandler,
  updateRpgMapHandler,
  updateRpgMapMarkerGroupHandler,
  updateRpgMapSectionHandler,
} from "@api/presentation/routes/rpgMap/handlers"
import {
  expelMemberHandler,
  getCharacterRequestsHandler,
  listRpgMembersHandler,
  processCharacterRequestHandler,
  processMemberActionHandler,
  requestCharacterCreationHandler,
  requestJoinRpgHandler,
} from "@api/presentation/routes/rpgMembership/handlers"
import {
  createSkillHandler,
  createSkillLevelHandler,
  deleteSkillHandler,
  deleteSkillLevelHandler,
  getSkillByIdHandler,
  getSkillsSearchIndexHandler,
  listSkillsHandler,
  updateSkillHandler,
  updateSkillLevelHandler,
} from "@api/presentation/routes/skills/handlers"
import {
  characterImageHandlers,
  itemImageHandlers,
  libraryImageHandlers,
  mapImageHandlers,
  markerImageHandlers,
  rpgImageHandlers,
  sectionImageHandlers,
} from "@api/presentation/routes/uploads/handlers"

type WebHandler<TParams extends Record<string, string> = Record<string, string>> = (
  request: Request,
  params: TParams,
) => Promise<Response>

type RequestConverter = (request: FastifyRequest) => Request
type ResponseSender = (reply: FastifyReply, response: Response) => Promise<unknown>
type FastifyNativeHandler<TParams extends Record<string, string> = Record<string, string>> = (
  request: FastifyRequest<{ Params: TParams }>,
  reply: FastifyReply,
) => Promise<unknown>

function registerRoute<TParams extends Record<string, string> = Record<string, string>>(
  app: FastifyInstance,
  method: "get" | "post" | "patch" | "put" | "delete",
  url: string,
  toWebRequest: RequestConverter,
  sendWebResponse: ResponseSender,
  handler: WebHandler<TParams>,
) {
  app[method]<RouteGenericInterface & { Params: TParams }>(url, async (request, reply) => {
    const webRequest = toWebRequest(request)
    const response = await handler(webRequest, request.params as TParams)
    return sendWebResponse(reply, appendCorsHeaders(response, webRequest))
  })
}

function registerFastifyRoute<TParams extends Record<string, string> = Record<string, string>>(
  app: FastifyInstance,
  method: "get" | "post" | "patch" | "put" | "delete",
  url: string,
  toWebRequest: RequestConverter,
  handler: FastifyNativeHandler<TParams>,
) {
  app[method]<RouteGenericInterface & { Params: TParams }>(url, async (request, reply) => {
    const webRequest = toWebRequest(request)
    const allowedOrigin = resolveAllowedOrigin(webRequest)
    if (allowedOrigin) {
      reply.header("Access-Control-Allow-Origin", allowedOrigin)
      reply.header("Access-Control-Allow-Credentials", "true")
      reply.header("Vary", "Origin")
    }
    return handler(request as FastifyRequest<{ Params: TParams }>, reply)
  })
}

export function registerApiRoutes(
  app: FastifyInstance,
  toWebRequest: RequestConverter,
  sendWebResponse: ResponseSender,
) {
  registerFastifyRoute(app, "get", "/api/health", toWebRequest, (_request, reply) =>
    healthHandler(reply),
  )
  registerFastifyRoute(app, "post", "/api/auth/login", toWebRequest, (request, reply) =>
    loginHandler(request, reply),
  )
  registerFastifyRoute(app, "post", "/api/auth/register", toWebRequest, (request, reply) =>
    registerHandler(request, reply),
  )
  registerFastifyRoute(app, "post", "/api/auth/logout", toWebRequest, (_request, reply) =>
    logoutHandler(reply),
  )
  registerFastifyRoute(app, "post", "/api/rpg", toWebRequest, (request, reply) =>
    createRpgHandler(request, reply),
  )

  registerFastifyRoute(app, "get", "/api/rpg/:rpgId", toWebRequest, (request, reply) =>
    getRpgByIdHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "patch", "/api/rpg/:rpgId", toWebRequest, (request, reply) =>
    updateRpgHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "delete", "/api/rpg/:rpgId", toWebRequest, (request, reply) =>
    deleteRpgHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )

  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/attributes", toWebRequest, (request, reply) =>
    getAttributeTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "put", "/api/rpg/:rpgId/attributes", toWebRequest, (request, reply) =>
    updateAttributeTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/statuses", toWebRequest, (request, reply) =>
    getStatusTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "put", "/api/rpg/:rpgId/statuses", toWebRequest, (request, reply) =>
    updateStatusTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/skills", toWebRequest, (request, reply) =>
    getSkillTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "put", "/api/rpg/:rpgId/skills", toWebRequest, (request, reply) =>
    updateSkillTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/races", toWebRequest, (request, reply) =>
    getRaceTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "put", "/api/rpg/:rpgId/races", toWebRequest, (request, reply) =>
    updateRaceTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/classes", toWebRequest, (request, reply) =>
    getClassTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "put", "/api/rpg/:rpgId/classes", toWebRequest, (request, reply) =>
    updateClassTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/character-identity", toWebRequest, (request, reply) =>
    getIdentityTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "put", "/api/rpg/:rpgId/character-identity", toWebRequest, (request, reply) =>
    updateIdentityTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/character-characteristics", toWebRequest, (request, reply) =>
    getCharacteristicTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "put", "/api/rpg/:rpgId/character-characteristics", toWebRequest, (request, reply) =>
    updateCharacteristicTemplatesHandler(
      request as FastifyRequest<{ Params: { rpgId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/maps", toWebRequest, (request, reply) =>
    listRpgMapsHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/maps", toWebRequest, (request, reply) =>
    createRpgMapHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/maps/:mapId", toWebRequest, (request, reply) =>
    getRpgMapDetailHandler(
      request as FastifyRequest<{ Params: { rpgId: string; mapId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "patch", "/api/rpg/:rpgId/maps/:mapId", toWebRequest, (request, reply) =>
    updateRpgMapHandler(
      request as FastifyRequest<{ Params: { rpgId: string; mapId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "delete", "/api/rpg/:rpgId/maps/:mapId", toWebRequest, (request, reply) =>
    deleteRpgMapHandler(
      request as FastifyRequest<{ Params: { rpgId: string; mapId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/maps/:mapId/sections", toWebRequest, (request, reply) =>
    createRpgMapSectionHandler(
      request as FastifyRequest<{ Params: { rpgId: string; mapId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "patch", "/api/rpg/:rpgId/maps/:mapId/sections/:sectionId", toWebRequest, (request, reply) =>
    updateRpgMapSectionHandler(
      request as FastifyRequest<{ Params: { rpgId: string; mapId: string; sectionId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "delete", "/api/rpg/:rpgId/maps/:mapId/sections/:sectionId", toWebRequest, (request, reply) =>
    deleteRpgMapSectionHandler(
      request as FastifyRequest<{ Params: { rpgId: string; mapId: string; sectionId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/maps/:mapId/sections/:sectionId/reorder", toWebRequest, (request, reply) =>
    reorderRpgMapSectionHandler(
      request as FastifyRequest<{ Params: { rpgId: string; mapId: string; sectionId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/maps/:mapId/marker-groups", toWebRequest, (request, reply) =>
    createRpgMapMarkerGroupHandler(
      request as FastifyRequest<{ Params: { rpgId: string; mapId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "patch", "/api/rpg/:rpgId/maps/:mapId/marker-groups/:groupId", toWebRequest, (request, reply) =>
    updateRpgMapMarkerGroupHandler(
      request as FastifyRequest<{ Params: { rpgId: string; mapId: string; groupId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "delete", "/api/rpg/:rpgId/maps/:mapId/marker-groups/:groupId", toWebRequest, (request, reply) =>
    deleteRpgMapMarkerGroupHandler(
      request as FastifyRequest<{ Params: { rpgId: string; mapId: string; groupId: string } }>,
      reply,
    ),
  )

  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/library/sections", toWebRequest, (request, reply) =>
    listLibrarySectionsHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/library/sections", toWebRequest, (request, reply) =>
    createLibrarySectionHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/library/sections/:sectionId", toWebRequest, (request, reply) =>
    getLibrarySectionHandler(
      request as FastifyRequest<{ Params: { rpgId: string; sectionId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "patch", "/api/rpg/:rpgId/library/sections/:sectionId", toWebRequest, (request, reply) =>
    updateLibrarySectionHandler(
      request as FastifyRequest<{ Params: { rpgId: string; sectionId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "delete", "/api/rpg/:rpgId/library/sections/:sectionId", toWebRequest, (request, reply) =>
    deleteLibrarySectionHandler(
      request as FastifyRequest<{ Params: { rpgId: string; sectionId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/library/sections/:sectionId/books", toWebRequest, (request, reply) =>
    listLibrarySectionBooksHandler(
      request as FastifyRequest<{ Params: { rpgId: string; sectionId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/library/sections/:sectionId/books", toWebRequest, (request, reply) =>
    createLibraryBookHandler(
      request as FastifyRequest<{ Params: { rpgId: string; sectionId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/library/books/:bookId", toWebRequest, (request, reply) =>
    getLibraryBookHandler(
      request as FastifyRequest<{ Params: { rpgId: string; bookId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "patch", "/api/rpg/:rpgId/library/books/:bookId", toWebRequest, (request, reply) =>
    updateLibraryBookHandler(
      request as FastifyRequest<{ Params: { rpgId: string; bookId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "delete", "/api/rpg/:rpgId/library/books/:bookId", toWebRequest, (request, reply) =>
    deleteLibraryBookHandler(
      request as FastifyRequest<{ Params: { rpgId: string; bookId: string } }>,
      reply,
    ),
  )

  registerFastifyRoute(app, "get", "/api/skills", toWebRequest, (request, reply) =>
    listSkillsHandler(request as unknown as FastifyRequest<{ Querystring: { rpgId?: string } }>, reply),
  )
  registerFastifyRoute(app, "post", "/api/skills", toWebRequest, (request, reply) =>
    createSkillHandler(request, reply),
  )
  registerFastifyRoute(app, "post", "/api/skills/search-index", toWebRequest, (request, reply) =>
    getSkillsSearchIndexHandler(request, reply),
  )
  registerFastifyRoute(app, "get", "/api/skills/:id", toWebRequest, (request, reply) =>
    getSkillByIdHandler(request as FastifyRequest<{ Params: { id: string } }>, reply),
  )
  registerFastifyRoute(app, "patch", "/api/skills/:id", toWebRequest, (request, reply) =>
    updateSkillHandler(request as FastifyRequest<{ Params: { id: string } }>, reply),
  )
  registerFastifyRoute(app, "delete", "/api/skills/:id", toWebRequest, (request, reply) =>
    deleteSkillHandler(request as FastifyRequest<{ Params: { id: string } }>, reply),
  )
  registerFastifyRoute(app, "post", "/api/skills/:id/levels", toWebRequest, (request, reply) =>
    createSkillLevelHandler(request as FastifyRequest<{ Params: { id: string } }>, reply),
  )
  registerFastifyRoute(app, "patch", "/api/skills/:id/levels/:levelId", toWebRequest, (request, reply) =>
    updateSkillLevelHandler(
      request as FastifyRequest<{ Params: { id: string; levelId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "delete", "/api/skills/:id/levels/:levelId", toWebRequest, (request, reply) =>
    deleteSkillLevelHandler(
      request as FastifyRequest<{ Params: { id: string; levelId: string } }>,
      reply,
    ),
  )

  registerRoute(app, "post", "/api/characters/:id/grant-xp", toWebRequest, sendWebResponse, (request, params: { id: string }) =>
    grantCharacterXpHandler(request, params),
  )
  registerRoute(app, "post", "/api/characters/:id/grant-points", toWebRequest, sendWebResponse, (request, params: { id: string }) =>
    grantCharacterPointsHandler(request, params),
  )
  registerRoute(app, "post", "/api/characters/:id/buy-skill", toWebRequest, sendWebResponse, (request, params: { id: string }) =>
    buyCharacterSkillHandler(request, params),
  )
  registerRoute(app, "delete", "/api/characters/:id/buy-skill", toWebRequest, sendWebResponse, (request, params: { id: string }) =>
    removeCharacterSkillHandler(request, params),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/items", toWebRequest, (request, reply) =>
    listItemsHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/items", toWebRequest, (request, reply) =>
    createItemHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/items/dashboard", toWebRequest, (request, reply) =>
    getItemsDashboardHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/items/give", toWebRequest, (request, reply) =>
    giveItemHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/items/:itemId", toWebRequest, (request, reply) =>
    getItemByIdHandler(
      request as FastifyRequest<{ Params: { rpgId: string; itemId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "patch", "/api/rpg/:rpgId/items/:itemId", toWebRequest, (request, reply) =>
    updateItemHandler(
      request as FastifyRequest<{ Params: { rpgId: string; itemId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "delete", "/api/rpg/:rpgId/items/:itemId", toWebRequest, (request, reply) =>
    deleteItemHandler(
      request as FastifyRequest<{ Params: { rpgId: string; itemId: string } }>,
      reply,
    ),
  )

  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/members", toWebRequest, (request, reply) =>
    listRpgMembersHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/members", toWebRequest, (request, reply) =>
    requestJoinRpgHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "patch", "/api/rpg/:rpgId/members/:memberId", toWebRequest, (request, reply) =>
    processMemberActionHandler(
      request as FastifyRequest<{ Params: { rpgId: string; memberId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "delete", "/api/rpg/:rpgId/members/:memberId", toWebRequest, (request, reply) =>
    expelMemberHandler(
      request as FastifyRequest<{ Params: { rpgId: string; memberId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/character-requests", toWebRequest, (request, reply) =>
    getCharacterRequestsHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/character-requests", toWebRequest, (request, reply) =>
    requestCharacterCreationHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "patch", "/api/rpg/:rpgId/character-requests/:requestId", toWebRequest, (request, reply) =>
    processCharacterRequestHandler(
      request as FastifyRequest<{ Params: { rpgId: string; requestId: string } }>,
      reply,
    ),
  )

  registerRoute(app, "get", "/api/rpg/:rpgId/characters", toWebRequest, sendWebResponse, (request, params: { rpgId: string }) =>
    listCharactersHandler(request, params),
  )
  registerRoute(app, "post", "/api/rpg/:rpgId/characters", toWebRequest, sendWebResponse, (request, params: { rpgId: string }) =>
    createCharacterHandler(request, params),
  )
  registerRoute(app, "get", "/api/rpg/:rpgId/characters/:characterId", toWebRequest, sendWebResponse, (request, params: { rpgId: string; characterId: string }) =>
    getCharacterByIdHandler(request, params),
  )
  registerRoute(app, "patch", "/api/rpg/:rpgId/characters/:characterId", toWebRequest, sendWebResponse, (request, params: { rpgId: string; characterId: string }) =>
    updateCharacterHandler(request, params),
  )
  registerRoute(app, "delete", "/api/rpg/:rpgId/characters/:characterId", toWebRequest, sendWebResponse, (request, params: { rpgId: string; characterId: string }) =>
    deleteCharacterHandler(request, params),
  )
  registerRoute(app, "get", "/api/rpg/:rpgId/characters/:characterId/inventory", toWebRequest, sendWebResponse, (request, params: { rpgId: string; characterId: string }) =>
    getCharacterInventoryHandler(request, params),
  )
  registerRoute(app, "post", "/api/rpg/:rpgId/characters/:characterId/inventory", toWebRequest, sendWebResponse, () =>
    createCharacterInventoryHandler(),
  )
  registerRoute(app, "delete", "/api/rpg/:rpgId/characters/:characterId/inventory", toWebRequest, sendWebResponse, (request, params: { rpgId: string; characterId: string }) =>
    removeCharacterInventoryHandler(request, params),
  )
  registerRoute(app, "patch", "/api/rpg/:rpgId/characters/:characterId/status-current", toWebRequest, sendWebResponse, (request, params: { rpgId: string; characterId: string }) =>
    updateCharacterStatusCurrentHandler(request, params),
  )
  registerRoute(app, "get", "/api/rpg/:rpgId/characters/:characterId/abilities", toWebRequest, sendWebResponse, (request, params: { rpgId: string; characterId: string }) =>
    getNpcMonsterCharacterAbilitiesHandler(request, params),
  )
  registerRoute(app, "post", "/api/rpg/:rpgId/characters/:characterId/abilities", toWebRequest, sendWebResponse, (request, params: { rpgId: string; characterId: string }) =>
    addNpcMonsterCharacterAbilityHandler(request, params),
  )
  registerRoute(app, "delete", "/api/rpg/:rpgId/characters/:characterId/abilities", toWebRequest, sendWebResponse, (request, params: { rpgId: string; characterId: string }) =>
    removeNpcMonsterCharacterAbilityHandler(request, params),
  )

  registerRoute(app, "post", "/api/uploads/character-image", toWebRequest, sendWebResponse, (request) =>
    characterImageHandlers.postHandler(request),
  )
  registerRoute(app, "delete", "/api/uploads/character-image", toWebRequest, sendWebResponse, (request) =>
    characterImageHandlers.deleteHandler!(request),
  )
  registerRoute(app, "post", "/api/uploads/item-image", toWebRequest, sendWebResponse, (request) =>
    itemImageHandlers.postHandler(request),
  )
  registerRoute(app, "delete", "/api/uploads/item-image", toWebRequest, sendWebResponse, (request) =>
    itemImageHandlers.deleteHandler!(request),
  )
  registerRoute(app, "post", "/api/uploads/library-image", toWebRequest, sendWebResponse, (request) =>
    libraryImageHandlers.postHandler(request),
  )
  registerRoute(app, "post", "/api/uploads/map-image", toWebRequest, sendWebResponse, (request) =>
    mapImageHandlers.postHandler(request),
  )
  registerRoute(app, "delete", "/api/uploads/map-image", toWebRequest, sendWebResponse, (request) =>
    mapImageHandlers.deleteHandler!(request),
  )
  registerRoute(app, "post", "/api/uploads/marker-image", toWebRequest, sendWebResponse, (request) =>
    markerImageHandlers.postHandler(request),
  )
  registerRoute(app, "delete", "/api/uploads/marker-image", toWebRequest, sendWebResponse, (request) =>
    markerImageHandlers.deleteHandler!(request),
  )
  registerRoute(app, "post", "/api/uploads/rpg-image", toWebRequest, sendWebResponse, (request) =>
    rpgImageHandlers.postHandler(request),
  )
  registerRoute(app, "delete", "/api/uploads/rpg-image", toWebRequest, sendWebResponse, (request) =>
    rpgImageHandlers.deleteHandler!(request),
  )
  registerRoute(app, "post", "/api/uploads/section-image", toWebRequest, sendWebResponse, (request) =>
    sectionImageHandlers.postHandler(request),
  )
  registerRoute(app, "delete", "/api/uploads/section-image", toWebRequest, sendWebResponse, (request) =>
    sectionImageHandlers.deleteHandler!(request),
  )
}
