import type { FastifyReply, FastifyRequest } from "fastify"
import {
  createRpgMap,
  createRpgMapMarkerGroup,
  createRpgMapSection,
  deleteRpgMap,
  deleteRpgMapMarkerGroup,
  deleteRpgMapSection,
  getRpgMapDetail,
  listRpgMaps,
  reorderRpgMapSection,
  updateRpgMap,
  updateRpgMapMarkerGroup,
  updateRpgMapSection,
} from "@/application/rpg/map/use-cases/rpgMap"
import { prismaRpgMapRepository } from "@/infrastructure/rpgMap/repositories/prismaRpgMapRepository"
import { rpgMapAccessService } from "@/infrastructure/rpgMap/services/rpgMapAccessService"
import {
  parseJsonBody,
  requireUserId,
  writeError,
  writeJson,
} from "@api/presentation/http/fastifyJson"

type RpgRouteParams = { rpgId: string }
type MapRouteParams = { rpgId: string; mapId: string }
type SectionRouteParams = { rpgId: string; mapId: string; sectionId: string }
type GroupRouteParams = { rpgId: string; mapId: string; groupId: string }

export async function listRpgMapsHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await listRpgMaps(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: request.params.rpgId,
      userId: auth.userId,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao listar mapas.")
  }
}

export async function createRpgMapHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const body = parseJsonBody(request.body)
    const payload = await createRpgMap(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: request.params.rpgId,
      userId: auth.userId,
      body,
    })

    return writeJson(reply, 201, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao criar mapa.")
  }
}

export async function getRpgMapDetailHandler(
  request: FastifyRequest<{ Params: MapRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await getRpgMapDetail(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: request.params.rpgId,
      mapId: request.params.mapId,
      userId: auth.userId,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao carregar mapa.")
  }
}

export async function updateRpgMapHandler(
  request: FastifyRequest<{ Params: MapRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const body = parseJsonBody(request.body)
    const payload = await updateRpgMap(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: request.params.rpgId,
      mapId: request.params.mapId,
      userId: auth.userId,
      body,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao atualizar mapa.")
  }
}

export async function deleteRpgMapHandler(
  request: FastifyRequest<{ Params: MapRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await deleteRpgMap(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: request.params.rpgId,
      mapId: request.params.mapId,
      userId: auth.userId,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao remover mapa.")
  }
}

export async function createRpgMapSectionHandler(
  request: FastifyRequest<{ Params: MapRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const body = parseJsonBody(request.body)
    const payload = await createRpgMapSection(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: request.params.rpgId,
      mapId: request.params.mapId,
      userId: auth.userId,
      body,
    })

    return writeJson(reply, 201, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao criar secao.")
  }
}

export async function updateRpgMapSectionHandler(
  request: FastifyRequest<{ Params: SectionRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const body = parseJsonBody(request.body)
    const payload = await updateRpgMapSection(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: request.params.rpgId,
      mapId: request.params.mapId,
      sectionId: request.params.sectionId,
      userId: auth.userId,
      body,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao atualizar secao.")
  }
}

export async function deleteRpgMapSectionHandler(
  request: FastifyRequest<{ Params: SectionRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await deleteRpgMapSection(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: request.params.rpgId,
      mapId: request.params.mapId,
      sectionId: request.params.sectionId,
      userId: auth.userId,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao remover secao.")
  }
}

export async function reorderRpgMapSectionHandler(
  request: FastifyRequest<{ Params: SectionRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const body = parseJsonBody(request.body)
    const payload = await reorderRpgMapSection(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: request.params.rpgId,
      mapId: request.params.mapId,
      sectionId: request.params.sectionId,
      userId: auth.userId,
      body,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao reordenar secao.")
  }
}

export async function createRpgMapMarkerGroupHandler(
  request: FastifyRequest<{ Params: MapRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const body = parseJsonBody(request.body)
    const payload = await createRpgMapMarkerGroup(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: request.params.rpgId,
      mapId: request.params.mapId,
      userId: auth.userId,
      body,
    })

    return writeJson(reply, 201, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao criar grupo de marcadores.")
  }
}

export async function updateRpgMapMarkerGroupHandler(
  request: FastifyRequest<{ Params: GroupRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const body = parseJsonBody(request.body)
    const payload = await updateRpgMapMarkerGroup(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: request.params.rpgId,
      mapId: request.params.mapId,
      groupId: request.params.groupId,
      userId: auth.userId,
      body,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao atualizar grupo de marcadores.")
  }
}

export async function deleteRpgMapMarkerGroupHandler(
  request: FastifyRequest<{ Params: GroupRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await deleteRpgMapMarkerGroup(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: request.params.rpgId,
      mapId: request.params.mapId,
      groupId: request.params.groupId,
      userId: auth.userId,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao remover grupo de marcadores.")
  }
}
