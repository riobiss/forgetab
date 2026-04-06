import type { FastifyInstance, FastifyReply, FastifyRequest, RouteGenericInterface } from "fastify"
import { resolveAllowedOrigin } from "@api/presentation/http/cors"
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
  listRpgCatalogHandler,
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

type FastifyNativeHandler<TParams extends Record<string, string> = Record<string, string>> = (
  request: FastifyRequest<{ Params: TParams }>,
  reply: FastifyReply,
) => Promise<unknown>

function registerFastifyRoute<TParams extends Record<string, string> = Record<string, string>>(
  app: FastifyInstance,
  method: "get" | "post" | "patch" | "put" | "delete",
  url: string,
  handler: FastifyNativeHandler<TParams>,
) {
  app[method]<RouteGenericInterface & { Params: TParams }>(url, async (request, reply) => {
    const allowedOrigin = resolveAllowedOrigin(request.headers)
    if (allowedOrigin) {
      reply.header("Access-Control-Allow-Origin", allowedOrigin)
      reply.header("Access-Control-Allow-Credentials", "true")
      reply.header("Vary", "Origin")
    }
    return handler(request as FastifyRequest<{ Params: TParams }>, reply)
  })
}

export function registerApiRoutes(app: FastifyInstance) {
  registerFastifyRoute(app, "get", "/api/health", (_request, reply) =>
    healthHandler(reply),
  )
  registerFastifyRoute(app, "post", "/api/auth/login", (request, reply) =>
    loginHandler(request, reply),
  )
  registerFastifyRoute(app, "post", "/api/auth/register", (request, reply) =>
    registerHandler(request, reply),
  )
  registerFastifyRoute(app, "post", "/api/auth/logout", (_request, reply) =>
    logoutHandler(reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg", (request, reply) =>
    listRpgCatalogHandler(request, reply),
  )
  registerFastifyRoute(app, "post", "/api/rpg", (request, reply) =>
    createRpgHandler(request, reply),
  )

  registerFastifyRoute(app, "get", "/api/rpg/:rpgId", (request, reply) =>
    getRpgByIdHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "patch", "/api/rpg/:rpgId", (request, reply) =>
    updateRpgHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "delete", "/api/rpg/:rpgId", (request, reply) =>
    deleteRpgHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )

  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/attributes", (request, reply) =>
    getAttributeTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "put", "/api/rpg/:rpgId/attributes", (request, reply) =>
    updateAttributeTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/statuses", (request, reply) =>
    getStatusTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "put", "/api/rpg/:rpgId/statuses", (request, reply) =>
    updateStatusTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/skills", (request, reply) =>
    getSkillTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "put", "/api/rpg/:rpgId/skills", (request, reply) =>
    updateSkillTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/races", (request, reply) =>
    getRaceTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "put", "/api/rpg/:rpgId/races", (request, reply) =>
    updateRaceTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/classes", (request, reply) =>
    getClassTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "put", "/api/rpg/:rpgId/classes", (request, reply) =>
    updateClassTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/character-identity", (request, reply) =>
    getIdentityTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "put", "/api/rpg/:rpgId/character-identity", (request, reply) =>
    updateIdentityTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/character-characteristics", (request, reply) =>
    getCharacteristicTemplatesHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "put", "/api/rpg/:rpgId/character-characteristics", (request, reply) =>
    updateCharacteristicTemplatesHandler(
      request as FastifyRequest<{ Params: { rpgId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/maps", (request, reply) =>
    listRpgMapsHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/maps", (request, reply) =>
    createRpgMapHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/maps/:mapId", (request, reply) =>
    getRpgMapDetailHandler(
      request as FastifyRequest<{ Params: { rpgId: string; mapId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "patch", "/api/rpg/:rpgId/maps/:mapId", (request, reply) =>
    updateRpgMapHandler(
      request as FastifyRequest<{ Params: { rpgId: string; mapId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "delete", "/api/rpg/:rpgId/maps/:mapId", (request, reply) =>
    deleteRpgMapHandler(
      request as FastifyRequest<{ Params: { rpgId: string; mapId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/maps/:mapId/sections", (request, reply) =>
    createRpgMapSectionHandler(
      request as FastifyRequest<{ Params: { rpgId: string; mapId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "patch", "/api/rpg/:rpgId/maps/:mapId/sections/:sectionId", (request, reply) =>
    updateRpgMapSectionHandler(
      request as FastifyRequest<{ Params: { rpgId: string; mapId: string; sectionId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "delete", "/api/rpg/:rpgId/maps/:mapId/sections/:sectionId", (request, reply) =>
    deleteRpgMapSectionHandler(
      request as FastifyRequest<{ Params: { rpgId: string; mapId: string; sectionId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/maps/:mapId/sections/:sectionId/reorder", (request, reply) =>
    reorderRpgMapSectionHandler(
      request as FastifyRequest<{ Params: { rpgId: string; mapId: string; sectionId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/maps/:mapId/marker-groups", (request, reply) =>
    createRpgMapMarkerGroupHandler(
      request as FastifyRequest<{ Params: { rpgId: string; mapId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "patch", "/api/rpg/:rpgId/maps/:mapId/marker-groups/:groupId", (request, reply) =>
    updateRpgMapMarkerGroupHandler(
      request as FastifyRequest<{ Params: { rpgId: string; mapId: string; groupId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "delete", "/api/rpg/:rpgId/maps/:mapId/marker-groups/:groupId", (request, reply) =>
    deleteRpgMapMarkerGroupHandler(
      request as FastifyRequest<{ Params: { rpgId: string; mapId: string; groupId: string } }>,
      reply,
    ),
  )

  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/library/sections", (request, reply) =>
    listLibrarySectionsHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/library/sections", (request, reply) =>
    createLibrarySectionHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/library/sections/:sectionId", (request, reply) =>
    getLibrarySectionHandler(
      request as FastifyRequest<{ Params: { rpgId: string; sectionId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "patch", "/api/rpg/:rpgId/library/sections/:sectionId", (request, reply) =>
    updateLibrarySectionHandler(
      request as FastifyRequest<{ Params: { rpgId: string; sectionId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "delete", "/api/rpg/:rpgId/library/sections/:sectionId", (request, reply) =>
    deleteLibrarySectionHandler(
      request as FastifyRequest<{ Params: { rpgId: string; sectionId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/library/sections/:sectionId/books", (request, reply) =>
    listLibrarySectionBooksHandler(
      request as FastifyRequest<{ Params: { rpgId: string; sectionId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/library/sections/:sectionId/books", (request, reply) =>
    createLibraryBookHandler(
      request as FastifyRequest<{ Params: { rpgId: string; sectionId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/library/books/:bookId", (request, reply) =>
    getLibraryBookHandler(
      request as FastifyRequest<{ Params: { rpgId: string; bookId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "patch", "/api/rpg/:rpgId/library/books/:bookId", (request, reply) =>
    updateLibraryBookHandler(
      request as FastifyRequest<{ Params: { rpgId: string; bookId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "delete", "/api/rpg/:rpgId/library/books/:bookId", (request, reply) =>
    deleteLibraryBookHandler(
      request as FastifyRequest<{ Params: { rpgId: string; bookId: string } }>,
      reply,
    ),
  )

  registerFastifyRoute(app, "get", "/api/skills", (request, reply) =>
    listSkillsHandler(request as unknown as FastifyRequest<{ Querystring: { rpgId?: string } }>, reply),
  )
  registerFastifyRoute(app, "post", "/api/skills", (request, reply) =>
    createSkillHandler(request, reply),
  )
  registerFastifyRoute(app, "post", "/api/skills/search-index", (request, reply) =>
    getSkillsSearchIndexHandler(request, reply),
  )
  registerFastifyRoute(app, "get", "/api/skills/:id", (request, reply) =>
    getSkillByIdHandler(request as FastifyRequest<{ Params: { id: string } }>, reply),
  )
  registerFastifyRoute(app, "patch", "/api/skills/:id", (request, reply) =>
    updateSkillHandler(request as FastifyRequest<{ Params: { id: string } }>, reply),
  )
  registerFastifyRoute(app, "delete", "/api/skills/:id", (request, reply) =>
    deleteSkillHandler(request as FastifyRequest<{ Params: { id: string } }>, reply),
  )
  registerFastifyRoute(app, "post", "/api/skills/:id/levels", (request, reply) =>
    createSkillLevelHandler(request as FastifyRequest<{ Params: { id: string } }>, reply),
  )
  registerFastifyRoute(app, "patch", "/api/skills/:id/levels/:levelId", (request, reply) =>
    updateSkillLevelHandler(
      request as FastifyRequest<{ Params: { id: string; levelId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "delete", "/api/skills/:id/levels/:levelId", (request, reply) =>
    deleteSkillLevelHandler(
      request as FastifyRequest<{ Params: { id: string; levelId: string } }>,
      reply,
    ),
  )

  registerFastifyRoute(app, "post", "/api/characters/:id/grant-xp", (request, reply) =>
    grantCharacterXpHandler(request as FastifyRequest<{ Params: { id: string } }>, reply),
  )
  registerFastifyRoute(app, "post", "/api/characters/:id/grant-points", (request, reply) =>
    grantCharacterPointsHandler(request as FastifyRequest<{ Params: { id: string } }>, reply),
  )
  registerFastifyRoute(app, "post", "/api/characters/:id/buy-skill", (request, reply) =>
    buyCharacterSkillHandler(request as FastifyRequest<{ Params: { id: string } }>, reply),
  )
  registerFastifyRoute(app, "delete", "/api/characters/:id/buy-skill", (request, reply) =>
    removeCharacterSkillHandler(request as FastifyRequest<{ Params: { id: string } }>, reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/items", (request, reply) =>
    listItemsHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/items", (request, reply) =>
    createItemHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/items/dashboard", (request, reply) =>
    getItemsDashboardHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/items/give", (request, reply) =>
    giveItemHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/items/:itemId", (request, reply) =>
    getItemByIdHandler(
      request as FastifyRequest<{ Params: { rpgId: string; itemId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "patch", "/api/rpg/:rpgId/items/:itemId", (request, reply) =>
    updateItemHandler(
      request as FastifyRequest<{ Params: { rpgId: string; itemId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "delete", "/api/rpg/:rpgId/items/:itemId", (request, reply) =>
    deleteItemHandler(
      request as FastifyRequest<{ Params: { rpgId: string; itemId: string } }>,
      reply,
    ),
  )

  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/members", (request, reply) =>
    listRpgMembersHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/members", (request, reply) =>
    requestJoinRpgHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "patch", "/api/rpg/:rpgId/members/:memberId", (request, reply) =>
    processMemberActionHandler(
      request as FastifyRequest<{ Params: { rpgId: string; memberId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "delete", "/api/rpg/:rpgId/members/:memberId", (request, reply) =>
    expelMemberHandler(
      request as FastifyRequest<{ Params: { rpgId: string; memberId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/character-requests", (request, reply) =>
    getCharacterRequestsHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/character-requests", (request, reply) =>
    requestCharacterCreationHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "patch", "/api/rpg/:rpgId/character-requests/:requestId", (request, reply) =>
    processCharacterRequestHandler(
      request as FastifyRequest<{ Params: { rpgId: string; requestId: string } }>,
      reply,
    ),
  )

  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/characters", (request, reply) =>
    listCharactersHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/characters", (request, reply) =>
    createCharacterHandler(request as FastifyRequest<{ Params: { rpgId: string } }>, reply),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/characters/:characterId", (request, reply) =>
    getCharacterByIdHandler(
      request as FastifyRequest<{ Params: { rpgId: string; characterId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "patch", "/api/rpg/:rpgId/characters/:characterId", (request, reply) =>
    updateCharacterHandler(
      request as FastifyRequest<{ Params: { rpgId: string; characterId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "delete", "/api/rpg/:rpgId/characters/:characterId", (request, reply) =>
    deleteCharacterHandler(
      request as FastifyRequest<{ Params: { rpgId: string; characterId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/characters/:characterId/inventory", (request, reply) =>
    getCharacterInventoryHandler(
      request as FastifyRequest<{ Params: { rpgId: string; characterId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/characters/:characterId/inventory", (_request, reply) =>
    createCharacterInventoryHandler(reply),
  )
  registerFastifyRoute(app, "delete", "/api/rpg/:rpgId/characters/:characterId/inventory", (request, reply) =>
    removeCharacterInventoryHandler(
      request as FastifyRequest<{ Params: { rpgId: string; characterId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "patch", "/api/rpg/:rpgId/characters/:characterId/status-current", (request, reply) =>
    updateCharacterStatusCurrentHandler(
      request as FastifyRequest<{ Params: { rpgId: string; characterId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "get", "/api/rpg/:rpgId/characters/:characterId/abilities", (request, reply) =>
    getNpcMonsterCharacterAbilitiesHandler(
      request as FastifyRequest<{ Params: { rpgId: string; characterId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "post", "/api/rpg/:rpgId/characters/:characterId/abilities", (request, reply) =>
    addNpcMonsterCharacterAbilityHandler(
      request as FastifyRequest<{ Params: { rpgId: string; characterId: string } }>,
      reply,
    ),
  )
  registerFastifyRoute(app, "delete", "/api/rpg/:rpgId/characters/:characterId/abilities", (request, reply) =>
    removeNpcMonsterCharacterAbilityHandler(
      request as FastifyRequest<{ Params: { rpgId: string; characterId: string } }>,
      reply,
    ),
  )

  registerFastifyRoute(app, "post", "/api/uploads/character-image", (request, reply) =>
    characterImageHandlers.postHandler(request, reply),
  )
  registerFastifyRoute(app, "delete", "/api/uploads/character-image", (request, reply) =>
    characterImageHandlers.deleteHandler!(request, reply),
  )
  registerFastifyRoute(app, "post", "/api/uploads/item-image", (request, reply) =>
    itemImageHandlers.postHandler(request, reply),
  )
  registerFastifyRoute(app, "delete", "/api/uploads/item-image", (request, reply) =>
    itemImageHandlers.deleteHandler!(request, reply),
  )
  registerFastifyRoute(app, "post", "/api/uploads/library-image", (request, reply) =>
    libraryImageHandlers.postHandler(request, reply),
  )
  registerFastifyRoute(app, "post", "/api/uploads/map-image", (request, reply) =>
    mapImageHandlers.postHandler(request, reply),
  )
  registerFastifyRoute(app, "delete", "/api/uploads/map-image", (request, reply) =>
    mapImageHandlers.deleteHandler!(request, reply),
  )
  registerFastifyRoute(app, "post", "/api/uploads/marker-image", (request, reply) =>
    markerImageHandlers.postHandler(request, reply),
  )
  registerFastifyRoute(app, "delete", "/api/uploads/marker-image", (request, reply) =>
    markerImageHandlers.deleteHandler!(request, reply),
  )
  registerFastifyRoute(app, "post", "/api/uploads/rpg-image", (request, reply) =>
    rpgImageHandlers.postHandler(request, reply),
  )
  registerFastifyRoute(app, "delete", "/api/uploads/rpg-image", (request, reply) =>
    rpgImageHandlers.deleteHandler!(request, reply),
  )
  registerFastifyRoute(app, "post", "/api/uploads/section-image", (request, reply) =>
    sectionImageHandlers.postHandler(request, reply),
  )
  registerFastifyRoute(app, "delete", "/api/uploads/section-image", (request, reply) =>
    sectionImageHandlers.deleteHandler!(request, reply),
  )
}
