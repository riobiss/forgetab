import { createServer } from "node:http"
import { Readable } from "node:stream"
import { appendCorsHeaders, createCorsPreflightResponse } from "../../src/backend/http/cors"
import {
  healthHandler,
  loginHandler,
  logoutHandler,
  registerHandler,
} from "../../src/backend/routes/auth/handlers"
import { createRpgHandler } from "../../src/backend/routes/rpg/handlers"
import {
  expelMemberHandler,
  getCharacterRequestsHandler,
  listRpgMembersHandler,
  processCharacterRequestHandler,
  processMemberActionHandler,
  requestCharacterCreationHandler,
  requestJoinRpgHandler,
} from "../../src/backend/routes/rpgMembership/handlers"
import {
  createItemHandler,
  deleteItemHandler,
  getItemByIdHandler,
  getItemsDashboardHandler,
  giveItemHandler,
  listItemsHandler,
  updateItemHandler,
} from "../../src/backend/routes/items/handlers"
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
} from "../../src/backend/routes/library/handlers"
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
} from "../../src/backend/routes/rpgConfig/handlers"
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
} from "../../src/backend/routes/rpgMap/handlers"
import {
  characterImageHandlers,
  itemImageHandlers,
  libraryImageHandlers,
  mapImageHandlers,
  markerImageHandlers,
  rpgImageHandlers,
  sectionImageHandlers,
} from "../../src/backend/routes/uploads/handlers"
import {
  buyCharacterSkillHandler,
  deleteCharacterHandler,
  createCharacterHandler,
  createCharacterInventoryHandler,
  getCharacterByIdHandler,
  grantCharacterPointsHandler,
  grantCharacterXpHandler,
  getCharacterInventoryHandler,
  getNpcMonsterCharacterAbilitiesHandler,
  listCharactersHandler,
  addNpcMonsterCharacterAbilityHandler,
  removeCharacterSkillHandler,
  removeCharacterInventoryHandler,
  removeNpcMonsterCharacterAbilityHandler,
  updateCharacterHandler,
  updateCharacterStatusCurrentHandler,
} from "../../src/backend/routes/characters/handlers"
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
} from "../../src/backend/routes/skills/handlers"

const apiPort = Number(process.env.API_PORT ?? 4000)

type RouteHandler = (request: Request, params: Record<string, string>) => Promise<Response>

const routes = new Map<string, RouteHandler>([
  ["GET /api/health", () => healthHandler()],
  ["POST /api/auth/login", (request) => loginHandler(request)],
  ["POST /api/auth/register", (request) => registerHandler(request)],
  ["POST /api/auth/logout", () => logoutHandler()],
  ["POST /api/rpg", (request) => createRpgHandler(request)],
  ["GET /api/skills", (request) => listSkillsHandler(request)],
  ["POST /api/skills", (request) => createSkillHandler(request)],
  ["POST /api/skills/search-index", (request) => getSkillsSearchIndexHandler(request)],
  ["POST /api/uploads/character-image", (request) => characterImageHandlers.postHandler(request)],
  ["DELETE /api/uploads/character-image", (request) => characterImageHandlers.deleteHandler!(request)],
  ["POST /api/uploads/item-image", (request) => itemImageHandlers.postHandler(request)],
  ["DELETE /api/uploads/item-image", (request) => itemImageHandlers.deleteHandler!(request)],
  ["POST /api/uploads/library-image", (request) => libraryImageHandlers.postHandler(request)],
  ["POST /api/uploads/map-image", (request) => mapImageHandlers.postHandler(request)],
  ["DELETE /api/uploads/map-image", (request) => mapImageHandlers.deleteHandler!(request)],
  ["POST /api/uploads/marker-image", (request) => markerImageHandlers.postHandler(request)],
  ["DELETE /api/uploads/marker-image", (request) => markerImageHandlers.deleteHandler!(request)],
  ["POST /api/uploads/rpg-image", (request) => rpgImageHandlers.postHandler(request)],
  ["DELETE /api/uploads/rpg-image", (request) => rpgImageHandlers.deleteHandler!(request)],
  ["POST /api/uploads/section-image", (request) => sectionImageHandlers.postHandler(request)],
  ["DELETE /api/uploads/section-image", (request) => sectionImageHandlers.deleteHandler!(request)],
])

const dynamicRoutes: Array<{
  method: string
  pattern: RegExp
  buildParams: (match: RegExpMatchArray) => Record<string, string>
  handler: RouteHandler
}> = [
  {
    method: "GET",
    pattern: /^\/api\/rpg\/([^/]+)\/attributes$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => getAttributeTemplatesHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "PUT",
    pattern: /^\/api\/rpg\/([^/]+)\/attributes$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => updateAttributeTemplatesHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "GET",
    pattern: /^\/api\/rpg\/([^/]+)\/statuses$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => getStatusTemplatesHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "PUT",
    pattern: /^\/api\/rpg\/([^/]+)\/statuses$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => updateStatusTemplatesHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "GET",
    pattern: /^\/api\/rpg\/([^/]+)\/skills$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => getSkillTemplatesHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "PUT",
    pattern: /^\/api\/rpg\/([^/]+)\/skills$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => updateSkillTemplatesHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "GET",
    pattern: /^\/api\/rpg\/([^/]+)\/races$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => getRaceTemplatesHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "PUT",
    pattern: /^\/api\/rpg\/([^/]+)\/races$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => updateRaceTemplatesHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "GET",
    pattern: /^\/api\/rpg\/([^/]+)\/classes$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => getClassTemplatesHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "PUT",
    pattern: /^\/api\/rpg\/([^/]+)\/classes$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => updateClassTemplatesHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "GET",
    pattern: /^\/api\/rpg\/([^/]+)\/character-identity$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => getIdentityTemplatesHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "PUT",
    pattern: /^\/api\/rpg\/([^/]+)\/character-identity$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => updateIdentityTemplatesHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "GET",
    pattern: /^\/api\/rpg\/([^/]+)\/character-characteristics$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => getCharacteristicTemplatesHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "PUT",
    pattern: /^\/api\/rpg\/([^/]+)\/character-characteristics$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) =>
      updateCharacteristicTemplatesHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "GET",
    pattern: /^\/api\/rpg\/([^/]+)\/maps$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => listRpgMapsHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "POST",
    pattern: /^\/api\/rpg\/([^/]+)\/maps$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => createRpgMapHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "GET",
    pattern: /^\/api\/rpg\/([^/]+)\/maps\/([^/]+)$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      mapId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      getRpgMapDetailHandler(request, { rpgId: params.rpgId, mapId: params.mapId }),
  },
  {
    method: "PATCH",
    pattern: /^\/api\/rpg\/([^/]+)\/maps\/([^/]+)$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      mapId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      updateRpgMapHandler(request, { rpgId: params.rpgId, mapId: params.mapId }),
  },
  {
    method: "DELETE",
    pattern: /^\/api\/rpg\/([^/]+)\/maps\/([^/]+)$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      mapId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      deleteRpgMapHandler(request, { rpgId: params.rpgId, mapId: params.mapId }),
  },
  {
    method: "POST",
    pattern: /^\/api\/rpg\/([^/]+)\/maps\/([^/]+)\/sections$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      mapId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      createRpgMapSectionHandler(request, { rpgId: params.rpgId, mapId: params.mapId }),
  },
  {
    method: "PATCH",
    pattern: /^\/api\/rpg\/([^/]+)\/maps\/([^/]+)\/sections\/([^/]+)$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      mapId: decodeURIComponent(match[2]),
      sectionId: decodeURIComponent(match[3]),
    }),
    handler: (request, params) =>
      updateRpgMapSectionHandler(request, {
        rpgId: params.rpgId,
        mapId: params.mapId,
        sectionId: params.sectionId,
      }),
  },
  {
    method: "DELETE",
    pattern: /^\/api\/rpg\/([^/]+)\/maps\/([^/]+)\/sections\/([^/]+)$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      mapId: decodeURIComponent(match[2]),
      sectionId: decodeURIComponent(match[3]),
    }),
    handler: (request, params) =>
      deleteRpgMapSectionHandler(request, {
        rpgId: params.rpgId,
        mapId: params.mapId,
        sectionId: params.sectionId,
      }),
  },
  {
    method: "POST",
    pattern: /^\/api\/rpg\/([^/]+)\/maps\/([^/]+)\/sections\/([^/]+)\/reorder$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      mapId: decodeURIComponent(match[2]),
      sectionId: decodeURIComponent(match[3]),
    }),
    handler: (request, params) =>
      reorderRpgMapSectionHandler(request, {
        rpgId: params.rpgId,
        mapId: params.mapId,
        sectionId: params.sectionId,
      }),
  },
  {
    method: "POST",
    pattern: /^\/api\/rpg\/([^/]+)\/maps\/([^/]+)\/marker-groups$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      mapId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      createRpgMapMarkerGroupHandler(request, { rpgId: params.rpgId, mapId: params.mapId }),
  },
  {
    method: "PATCH",
    pattern: /^\/api\/rpg\/([^/]+)\/maps\/([^/]+)\/marker-groups\/([^/]+)$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      mapId: decodeURIComponent(match[2]),
      groupId: decodeURIComponent(match[3]),
    }),
    handler: (request, params) =>
      updateRpgMapMarkerGroupHandler(request, {
        rpgId: params.rpgId,
        mapId: params.mapId,
        groupId: params.groupId,
      }),
  },
  {
    method: "DELETE",
    pattern: /^\/api\/rpg\/([^/]+)\/maps\/([^/]+)\/marker-groups\/([^/]+)$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      mapId: decodeURIComponent(match[2]),
      groupId: decodeURIComponent(match[3]),
    }),
    handler: (request, params) =>
      deleteRpgMapMarkerGroupHandler(request, {
        rpgId: params.rpgId,
        mapId: params.mapId,
        groupId: params.groupId,
      }),
  },
  {
    method: "GET",
    pattern: /^\/api\/rpg\/([^/]+)\/library\/sections$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => listLibrarySectionsHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "POST",
    pattern: /^\/api\/rpg\/([^/]+)\/library\/sections$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => createLibrarySectionHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "GET",
    pattern: /^\/api\/rpg\/([^/]+)\/library\/sections\/([^/]+)$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      sectionId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      getLibrarySectionHandler(request, { rpgId: params.rpgId, sectionId: params.sectionId }),
  },
  {
    method: "PATCH",
    pattern: /^\/api\/rpg\/([^/]+)\/library\/sections\/([^/]+)$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      sectionId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      updateLibrarySectionHandler(request, { rpgId: params.rpgId, sectionId: params.sectionId }),
  },
  {
    method: "DELETE",
    pattern: /^\/api\/rpg\/([^/]+)\/library\/sections\/([^/]+)$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      sectionId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      deleteLibrarySectionHandler(request, { rpgId: params.rpgId, sectionId: params.sectionId }),
  },
  {
    method: "GET",
    pattern: /^\/api\/rpg\/([^/]+)\/library\/sections\/([^/]+)\/books$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      sectionId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      listLibrarySectionBooksHandler(request, { rpgId: params.rpgId, sectionId: params.sectionId }),
  },
  {
    method: "POST",
    pattern: /^\/api\/rpg\/([^/]+)\/library\/sections\/([^/]+)\/books$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      sectionId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      createLibraryBookHandler(request, { rpgId: params.rpgId, sectionId: params.sectionId }),
  },
  {
    method: "GET",
    pattern: /^\/api\/rpg\/([^/]+)\/library\/books\/([^/]+)$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      bookId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      getLibraryBookHandler(request, { rpgId: params.rpgId, bookId: params.bookId }),
  },
  {
    method: "PATCH",
    pattern: /^\/api\/rpg\/([^/]+)\/library\/books\/([^/]+)$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      bookId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      updateLibraryBookHandler(request, { rpgId: params.rpgId, bookId: params.bookId }),
  },
  {
    method: "DELETE",
    pattern: /^\/api\/rpg\/([^/]+)\/library\/books\/([^/]+)$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      bookId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      deleteLibraryBookHandler(request, { rpgId: params.rpgId, bookId: params.bookId }),
  },
  {
    method: "GET",
    pattern: /^\/api\/skills\/([^/]+)$/,
    buildParams: (match) => ({ id: decodeURIComponent(match[1]) }),
    handler: (request, params) => getSkillByIdHandler(request, { id: params.id }),
  },
  {
    method: "PATCH",
    pattern: /^\/api\/skills\/([^/]+)$/,
    buildParams: (match) => ({ id: decodeURIComponent(match[1]) }),
    handler: (request, params) => updateSkillHandler(request, { id: params.id }),
  },
  {
    method: "DELETE",
    pattern: /^\/api\/skills\/([^/]+)$/,
    buildParams: (match) => ({ id: decodeURIComponent(match[1]) }),
    handler: (request, params) => deleteSkillHandler(request, { id: params.id }),
  },
  {
    method: "POST",
    pattern: /^\/api\/skills\/([^/]+)\/levels$/,
    buildParams: (match) => ({ id: decodeURIComponent(match[1]) }),
    handler: (request, params) => createSkillLevelHandler(request, { id: params.id }),
  },
  {
    method: "PATCH",
    pattern: /^\/api\/skills\/([^/]+)\/levels\/([^/]+)$/,
    buildParams: (match) => ({
      id: decodeURIComponent(match[1]),
      levelId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      updateSkillLevelHandler(request, { id: params.id, levelId: params.levelId }),
  },
  {
    method: "DELETE",
    pattern: /^\/api\/skills\/([^/]+)\/levels\/([^/]+)$/,
    buildParams: (match) => ({
      id: decodeURIComponent(match[1]),
      levelId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      deleteSkillLevelHandler(request, { id: params.id, levelId: params.levelId }),
  },
  {
    method: "POST",
    pattern: /^\/api\/characters\/([^/]+)\/grant-xp$/,
    buildParams: (match) => ({ id: decodeURIComponent(match[1]) }),
    handler: (request, params) => grantCharacterXpHandler(request, { id: params.id }),
  },
  {
    method: "POST",
    pattern: /^\/api\/characters\/([^/]+)\/grant-points$/,
    buildParams: (match) => ({ id: decodeURIComponent(match[1]) }),
    handler: (request, params) => grantCharacterPointsHandler(request, { id: params.id }),
  },
  {
    method: "POST",
    pattern: /^\/api\/characters\/([^/]+)\/buy-skill$/,
    buildParams: (match) => ({ id: decodeURIComponent(match[1]) }),
    handler: (request, params) => buyCharacterSkillHandler(request, { id: params.id }),
  },
  {
    method: "DELETE",
    pattern: /^\/api\/characters\/([^/]+)\/buy-skill$/,
    buildParams: (match) => ({ id: decodeURIComponent(match[1]) }),
    handler: (request, params) => removeCharacterSkillHandler(request, { id: params.id }),
  },
  {
    method: "GET",
    pattern: /^\/api\/rpg\/([^/]+)\/items$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => listItemsHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "POST",
    pattern: /^\/api\/rpg\/([^/]+)\/items$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => createItemHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "GET",
    pattern: /^\/api\/rpg\/([^/]+)\/items\/dashboard$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => getItemsDashboardHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "POST",
    pattern: /^\/api\/rpg\/([^/]+)\/items\/give$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => giveItemHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "GET",
    pattern: /^\/api\/rpg\/([^/]+)\/items\/([^/]+)$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      itemId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      getItemByIdHandler(request, { rpgId: params.rpgId, itemId: params.itemId }),
  },
  {
    method: "PATCH",
    pattern: /^\/api\/rpg\/([^/]+)\/items\/([^/]+)$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      itemId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      updateItemHandler(request, { rpgId: params.rpgId, itemId: params.itemId }),
  },
  {
    method: "DELETE",
    pattern: /^\/api\/rpg\/([^/]+)\/items\/([^/]+)$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      itemId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      deleteItemHandler(request, { rpgId: params.rpgId, itemId: params.itemId }),
  },
  {
    method: "GET",
    pattern: /^\/api\/rpg\/([^/]+)\/members$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => listRpgMembersHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "POST",
    pattern: /^\/api\/rpg\/([^/]+)\/members$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => requestJoinRpgHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "PATCH",
    pattern: /^\/api\/rpg\/([^/]+)\/members\/([^/]+)$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      memberId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      processMemberActionHandler(request, {
        rpgId: params.rpgId,
        memberId: params.memberId,
      }),
  },
  {
    method: "DELETE",
    pattern: /^\/api\/rpg\/([^/]+)\/members\/([^/]+)$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      memberId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      expelMemberHandler(request, {
        rpgId: params.rpgId,
        memberId: params.memberId,
      }),
  },
  {
    method: "GET",
    pattern: /^\/api\/rpg\/([^/]+)\/character-requests$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => getCharacterRequestsHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "POST",
    pattern: /^\/api\/rpg\/([^/]+)\/character-requests$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) =>
      requestCharacterCreationHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "PATCH",
    pattern: /^\/api\/rpg\/([^/]+)\/character-requests\/([^/]+)$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      requestId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      processCharacterRequestHandler(request, {
        rpgId: params.rpgId,
        requestId: params.requestId,
      }),
  },
  {
    method: "GET",
    pattern: /^\/api\/rpg\/([^/]+)\/characters$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => listCharactersHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "POST",
    pattern: /^\/api\/rpg\/([^/]+)\/characters$/,
    buildParams: (match) => ({ rpgId: decodeURIComponent(match[1]) }),
    handler: (request, params) => createCharacterHandler(request, { rpgId: params.rpgId }),
  },
  {
    method: "GET",
    pattern: /^\/api\/rpg\/([^/]+)\/characters\/([^/]+)\/inventory$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      characterId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      getCharacterInventoryHandler(request, {
        rpgId: params.rpgId,
        characterId: params.characterId,
      }),
  },
  {
    method: "GET",
    pattern: /^\/api\/rpg\/([^/]+)\/characters\/([^/]+)$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      characterId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      getCharacterByIdHandler(request, {
        rpgId: params.rpgId,
        characterId: params.characterId,
      }),
  },
  {
    method: "PATCH",
    pattern: /^\/api\/rpg\/([^/]+)\/characters\/([^/]+)$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      characterId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      updateCharacterHandler(request, {
        rpgId: params.rpgId,
        characterId: params.characterId,
      }),
  },
  {
    method: "DELETE",
    pattern: /^\/api\/rpg\/([^/]+)\/characters\/([^/]+)$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      characterId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      deleteCharacterHandler(request, {
        rpgId: params.rpgId,
        characterId: params.characterId,
      }),
  },
  {
    method: "POST",
    pattern: /^\/api\/rpg\/([^/]+)\/characters\/([^/]+)\/inventory$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      characterId: decodeURIComponent(match[2]),
    }),
    handler: () => createCharacterInventoryHandler(),
  },
  {
    method: "DELETE",
    pattern: /^\/api\/rpg\/([^/]+)\/characters\/([^/]+)\/inventory$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      characterId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      removeCharacterInventoryHandler(request, {
        rpgId: params.rpgId,
        characterId: params.characterId,
      }),
  },
  {
    method: "PATCH",
    pattern: /^\/api\/rpg\/([^/]+)\/characters\/([^/]+)\/status-current$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      characterId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      updateCharacterStatusCurrentHandler(request, {
        rpgId: params.rpgId,
        characterId: params.characterId,
      }),
  },
  {
    method: "GET",
    pattern: /^\/api\/rpg\/([^/]+)\/characters\/([^/]+)\/abilities$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      characterId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      getNpcMonsterCharacterAbilitiesHandler(request, {
        rpgId: params.rpgId,
        characterId: params.characterId,
      }),
  },
  {
    method: "POST",
    pattern: /^\/api\/rpg\/([^/]+)\/characters\/([^/]+)\/abilities$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      characterId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      addNpcMonsterCharacterAbilityHandler(request, {
        rpgId: params.rpgId,
        characterId: params.characterId,
      }),
  },
  {
    method: "DELETE",
    pattern: /^\/api\/rpg\/([^/]+)\/characters\/([^/]+)\/abilities$/,
    buildParams: (match) => ({
      rpgId: decodeURIComponent(match[1]),
      characterId: decodeURIComponent(match[2]),
    }),
    handler: (request, params) =>
      removeNpcMonsterCharacterAbilityHandler(request, {
        rpgId: params.rpgId,
        characterId: params.characterId,
      }),
  },
]

function getRequestUrl(request: import("node:http").IncomingMessage) {
  const protocol = request.headers["x-forwarded-proto"] ?? "http"
  const host = request.headers.host ?? `localhost:${apiPort}`
  return `${protocol}://${host}${request.url ?? "/"}`
}

function toWebRequest(request: import("node:http").IncomingMessage) {
  const method = request.method ?? "GET"
  const body =
    method === "GET" || method === "HEAD"
      ? undefined
      : (Readable.toWeb(request) as unknown as ReadableStream)

  return new Request(getRequestUrl(request), {
    method,
    headers: new Headers(request.headers as Record<string, string>),
    body,
    duplex: body ? "half" : undefined,
  } as RequestInit & { duplex?: "half" })
}

async function sendWebResponse(
  nodeResponse: import("node:http").ServerResponse,
  response: Response,
) {
  nodeResponse.statusCode = response.status
  nodeResponse.statusMessage = response.statusText

  response.headers.forEach((value, key) => {
    nodeResponse.setHeader(key, value)
  })

  const buffer = Buffer.from(await response.arrayBuffer())
  nodeResponse.end(buffer)
}

function createNotFoundResponse() {
  return new Response(JSON.stringify({ message: "Rota nao encontrada." }), {
    status: 404,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  })
}

function resolveRoute(method: string, pathname: string) {
  const exactHandler = routes.get(`${method} ${pathname}`)
  if (exactHandler) {
    return { handler: exactHandler, params: {} as Record<string, string> }
  }

  for (const route of dynamicRoutes) {
    if (route.method !== method) {
      continue
    }

    const match = pathname.match(route.pattern)
    if (!match) {
      continue
    }

    return { handler: route.handler, params: route.buildParams(match) }
  }

  return null
}

const server = createServer(async (nodeRequest, nodeResponse) => {
  const request = toWebRequest(nodeRequest)

  if (request.method === "OPTIONS") {
    await sendWebResponse(nodeResponse, createCorsPreflightResponse(request))
    return
  }

  const resolvedRoute = resolveRoute(request.method.toUpperCase(), new URL(request.url).pathname)
  const response = resolvedRoute
    ? await resolvedRoute.handler(request, resolvedRoute.params)
    : createNotFoundResponse()

  await sendWebResponse(nodeResponse, appendCorsHeaders(response, request))
})

server.listen(apiPort, () => {
  console.log(`Forgetab API listening on http://localhost:${apiPort}`)
})
