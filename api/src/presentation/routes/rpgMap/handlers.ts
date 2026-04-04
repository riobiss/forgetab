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
} from "@/application/rpgMap/use-cases/rpgMap"
import { prismaRpgMapRepository } from "@/infrastructure/rpgMap/repositories/prismaRpgMapRepository"
import { rpgMapAccessService } from "@/infrastructure/rpgMap/services/rpgMapAccessService"
import { getUserIdFromRequest } from "@api/presentation/http/auth/requestAuth"
import { toErrorResponse } from "@api/presentation/http/responses/errors"
import { jsonResponse } from "@api/presentation/http/responses/jsonResponse"

type RpgRouteParams = { rpgId: string }
type MapRouteParams = { rpgId: string; mapId: string }
type SectionRouteParams = { rpgId: string; mapId: string; sectionId: string }
type GroupRouteParams = { rpgId: string; mapId: string; groupId: string }

async function requireUserId(request: Request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return {
      ok: false as const,
      response: jsonResponse({ message: "Usuario nao autenticado." }, { status: 401 }),
    }
  }

  return { ok: true as const, userId }
}

export async function listRpgMapsHandler(request: Request, params: RpgRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await listRpgMaps(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: params.rpgId,
      userId: auth.userId,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao listar mapas.")
  }
}

export async function createRpgMapHandler(request: Request, params: RpgRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const body = await request.json()
    const payload = await createRpgMap(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: params.rpgId,
      userId: auth.userId,
      body,
    })

    return jsonResponse(payload, { status: 201 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao criar mapa.")
  }
}

export async function getRpgMapDetailHandler(request: Request, params: MapRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await getRpgMapDetail(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: params.rpgId,
      mapId: params.mapId,
      userId: auth.userId,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao carregar mapa.")
  }
}

export async function updateRpgMapHandler(request: Request, params: MapRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const body = await request.json()
    const payload = await updateRpgMap(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: params.rpgId,
      mapId: params.mapId,
      userId: auth.userId,
      body,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar mapa.")
  }
}

export async function deleteRpgMapHandler(request: Request, params: MapRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await deleteRpgMap(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: params.rpgId,
      mapId: params.mapId,
      userId: auth.userId,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao remover mapa.")
  }
}

export async function createRpgMapSectionHandler(request: Request, params: MapRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const body = await request.json()
    const payload = await createRpgMapSection(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: params.rpgId,
      mapId: params.mapId,
      userId: auth.userId,
      body,
    })

    return jsonResponse(payload, { status: 201 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao criar secao.")
  }
}

export async function updateRpgMapSectionHandler(request: Request, params: SectionRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const body = await request.json()
    const payload = await updateRpgMapSection(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: params.rpgId,
      mapId: params.mapId,
      sectionId: params.sectionId,
      userId: auth.userId,
      body,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar secao.")
  }
}

export async function deleteRpgMapSectionHandler(request: Request, params: SectionRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await deleteRpgMapSection(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: params.rpgId,
      mapId: params.mapId,
      sectionId: params.sectionId,
      userId: auth.userId,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao remover secao.")
  }
}

export async function reorderRpgMapSectionHandler(request: Request, params: SectionRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const body = await request.json()
    const payload = await reorderRpgMapSection(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: params.rpgId,
      mapId: params.mapId,
      sectionId: params.sectionId,
      userId: auth.userId,
      body,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao reordenar secao.")
  }
}

export async function createRpgMapMarkerGroupHandler(request: Request, params: MapRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const body = await request.json()
    const payload = await createRpgMapMarkerGroup(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: params.rpgId,
      mapId: params.mapId,
      userId: auth.userId,
      body,
    })

    return jsonResponse(payload, { status: 201 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao criar grupo de marcadores.")
  }
}

export async function updateRpgMapMarkerGroupHandler(request: Request, params: GroupRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const body = await request.json()
    const payload = await updateRpgMapMarkerGroup(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: params.rpgId,
      mapId: params.mapId,
      groupId: params.groupId,
      userId: auth.userId,
      body,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar grupo de marcadores.")
  }
}

export async function deleteRpgMapMarkerGroupHandler(request: Request, params: GroupRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await deleteRpgMapMarkerGroup(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId: params.rpgId,
      mapId: params.mapId,
      groupId: params.groupId,
      userId: auth.userId,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao remover grupo de marcadores.")
  }
}
