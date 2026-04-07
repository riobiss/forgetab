import type { FastifyReply, FastifyRequest } from "fastify"
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
import {
  parseJsonBody,
  requireUserId,
  writeError,
  writeJson,
} from "@api/presentation/http/fastifyJson"

type RpgRouteParams = { rpgId: string }

export async function getAttributeTemplatesHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await getAttributeTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: request.params.rpgId,
      userId: auth.userId,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao buscar atributos.")
  }
}

export async function updateAttributeTemplatesHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const body = (parseJsonBody(request.body) ?? {}) as { attributes?: unknown }
    const payload = await updateAttributeTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: request.params.rpgId,
      userId: auth.userId,
      attributes: body.attributes,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao atualizar atributos.")
  }
}

export async function getStatusTemplatesHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await getStatusTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: request.params.rpgId,
      userId: auth.userId,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao buscar status.")
  }
}

export async function updateStatusTemplatesHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const body = (parseJsonBody(request.body) ?? {}) as { statuses?: unknown }
    const payload = await updateStatusTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: request.params.rpgId,
      userId: auth.userId,
      statuses: body.statuses,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao atualizar status.")
  }
}

export async function getSkillTemplatesHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await getSkillTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: request.params.rpgId,
      userId: auth.userId,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao buscar pericias.")
  }
}

export async function updateSkillTemplatesHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const body = (parseJsonBody(request.body) ?? {}) as { skills?: unknown }
    const payload = await updateSkillTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: request.params.rpgId,
      userId: auth.userId,
      skills: body.skills,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao atualizar pericias.")
  }
}

export async function getRaceTemplatesHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await getRaceTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: request.params.rpgId,
      userId: auth.userId,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao buscar racas.")
  }
}

export async function updateRaceTemplatesHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const body = (parseJsonBody(request.body) ?? {}) as { races?: unknown }
    const payload = await updateRaceTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: request.params.rpgId,
      userId: auth.userId,
      races: body.races,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao salvar racas.")
  }
}

export async function getClassTemplatesHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await getClassTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: request.params.rpgId,
      userId: auth.userId,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao buscar classes.")
  }
}

export async function updateClassTemplatesHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const body = (parseJsonBody(request.body) ?? {}) as { classes?: unknown }
    const payload = await updateClassTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: request.params.rpgId,
      userId: auth.userId,
      classes: body.classes,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao salvar classes.")
  }
}

export async function getIdentityTemplatesHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await getIdentityTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: request.params.rpgId,
      userId: auth.userId,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao buscar campos de identidade.")
  }
}

export async function updateIdentityTemplatesHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const body = (parseJsonBody(request.body) ?? {}) as { fields?: unknown }
    const payload = await updateIdentityTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: request.params.rpgId,
      userId: auth.userId,
      fields: body.fields,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao salvar campos de identidade.")
  }
}

export async function getCharacteristicTemplatesHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await getCharacteristicTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId: request.params.rpgId,
      userId: auth.userId,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao buscar campos de caracteristicas.")
  }
}

export async function updateCharacteristicTemplatesHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const body = (parseJsonBody(request.body) ?? {}) as { fields?: unknown }
    const payload = await updateCharacteristicTemplates(
      rpgConfigAccessService,
      prismaRpgConfigRepository,
      {
        rpgId: request.params.rpgId,
        userId: auth.userId,
        fields: body.fields,
      },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao salvar campos de caracteristicas.")
  }
}
