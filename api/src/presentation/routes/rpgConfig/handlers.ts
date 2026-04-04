import {
  getAttributeTemplates,
  getCharacteristicTemplates,
  getClassTemplates,
  getIdentityTemplates,
  getRaceTemplates,
  getSkillTemplates,
  getStatusTemplates,
  updateAttributeTemplates,
  updateCharacteristicTemplates,
  updateClassTemplates,
  updateIdentityTemplates,
  updateRaceTemplates,
  updateSkillTemplates,
  updateStatusTemplates,
} from "@/application/rpgConfig/use-cases/rpgConfig"
import { prismaRpgConfigRepository } from "@/infrastructure/rpgConfig/repositories/prismaRpgConfigRepository"
import { rpgConfigAccessService } from "@/infrastructure/rpgConfig/services/rpgConfigAccessService"
import { getUserIdFromRequest } from "@api/presentation/http/auth/requestAuth"
import { toErrorResponse } from "@api/presentation/http/responses/errors"
import { jsonResponse } from "@api/presentation/http/responses/jsonResponse"

type RpgRouteParams = { rpgId: string }

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

export async function getAttributeTemplatesHandler(request: Request, params: RpgRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) return auth.response

    const payload = await getAttributeTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: params.rpgId,
      userId: auth.userId,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao buscar atributos.")
  }
}

export async function updateAttributeTemplatesHandler(request: Request, params: RpgRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) return auth.response

    const body = (await request.json()) as { attributes?: unknown }
    const payload = await updateAttributeTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: params.rpgId,
      userId: auth.userId,
      attributes: body.attributes,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar atributos.")
  }
}

export async function getStatusTemplatesHandler(request: Request, params: RpgRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) return auth.response

    const payload = await getStatusTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: params.rpgId,
      userId: auth.userId,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao buscar status.")
  }
}

export async function updateStatusTemplatesHandler(request: Request, params: RpgRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) return auth.response

    const body = (await request.json()) as { statuses?: unknown }
    const payload = await updateStatusTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: params.rpgId,
      userId: auth.userId,
      statuses: body.statuses,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar status.")
  }
}

export async function getSkillTemplatesHandler(request: Request, params: RpgRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) return auth.response

    const payload = await getSkillTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: params.rpgId,
      userId: auth.userId,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao buscar pericias.")
  }
}

export async function updateSkillTemplatesHandler(request: Request, params: RpgRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) return auth.response

    const body = (await request.json()) as { skills?: unknown }
    const payload = await updateSkillTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: params.rpgId,
      userId: auth.userId,
      skills: body.skills,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar pericias.")
  }
}

export async function getRaceTemplatesHandler(request: Request, params: RpgRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) return auth.response

    const payload = await getRaceTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: params.rpgId,
      userId: auth.userId,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao buscar racas.")
  }
}

export async function updateRaceTemplatesHandler(request: Request, params: RpgRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) return auth.response

    const body = (await request.json()) as { races?: unknown }
    const payload = await updateRaceTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: params.rpgId,
      userId: auth.userId,
      races: body.races,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao salvar racas.")
  }
}

export async function getClassTemplatesHandler(request: Request, params: RpgRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) return auth.response

    const payload = await getClassTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: params.rpgId,
      userId: auth.userId,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao buscar classes.")
  }
}

export async function updateClassTemplatesHandler(request: Request, params: RpgRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) return auth.response

    const body = (await request.json()) as { classes?: unknown }
    const payload = await updateClassTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: params.rpgId,
      userId: auth.userId,
      classes: body.classes,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao salvar classes.")
  }
}

export async function getIdentityTemplatesHandler(request: Request, params: RpgRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) return auth.response

    const payload = await getIdentityTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: params.rpgId,
      userId: auth.userId,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao buscar campos de identidade.")
  }
}

export async function updateIdentityTemplatesHandler(request: Request, params: RpgRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) return auth.response

    const body = (await request.json()) as { fields?: unknown }
    const payload = await updateIdentityTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: params.rpgId,
      userId: auth.userId,
      fields: body.fields,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao salvar campos de identidade.")
  }
}

export async function getCharacteristicTemplatesHandler(request: Request, params: RpgRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) return auth.response

    const payload = await getCharacteristicTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: params.rpgId,
      userId: auth.userId,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao buscar campos de caracteristicas.")
  }
}

export async function updateCharacteristicTemplatesHandler(request: Request, params: RpgRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) return auth.response

    const body = (await request.json()) as { fields?: unknown }
    const payload = await updateCharacteristicTemplates(
      rpgConfigAccessService,
      prismaRpgConfigRepository,
      {
        rpgId: params.rpgId,
        userId: auth.userId,
        fields: body.fields,
      },
    )

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao salvar campos de caracteristicas.")
  }
}
