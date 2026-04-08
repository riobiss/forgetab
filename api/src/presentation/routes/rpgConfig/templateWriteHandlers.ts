import type { FastifyReply, FastifyRequest } from "fastify"
import {
  updateAttributeTemplates,
  updateCharacteristicTemplates,
  updateClassTemplates,
  updateIdentityTemplates,
  updateRaceTemplates,
  updateSkillTemplates,
  updateStatusTemplates,
} from "@/application/rpg/config/use-cases/rpgConfig"
import {
  parseJsonBody,
  requireUserId,
  writeError,
  writeJson,
} from "@api/presentation/http/fastifyJson"
import { rpgConfigRouteDeps } from "./dependencies"
import type { RpgRouteParams } from "./routeTypes"

export async function updateAttributeTemplatesHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response
    const body = (parseJsonBody(request.body) ?? {}) as { attributes?: unknown }
    const payload = await updateAttributeTemplates(
      rpgConfigRouteDeps.accessService,
      rpgConfigRouteDeps.repository,
      { rpgId: request.params.rpgId, userId: auth.userId, attributes: body.attributes },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao atualizar atributos.")
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
    const payload = await updateStatusTemplates(
      rpgConfigRouteDeps.accessService,
      rpgConfigRouteDeps.repository,
      { rpgId: request.params.rpgId, userId: auth.userId, statuses: body.statuses },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao atualizar status.")
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
    const payload = await updateSkillTemplates(
      rpgConfigRouteDeps.accessService,
      rpgConfigRouteDeps.repository,
      { rpgId: request.params.rpgId, userId: auth.userId, skills: body.skills },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao atualizar pericias.")
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
    const payload = await updateRaceTemplates(
      rpgConfigRouteDeps.accessService,
      rpgConfigRouteDeps.repository,
      { rpgId: request.params.rpgId, userId: auth.userId, races: body.races },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao salvar racas.")
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
    const payload = await updateClassTemplates(
      rpgConfigRouteDeps.accessService,
      rpgConfigRouteDeps.repository,
      { rpgId: request.params.rpgId, userId: auth.userId, classes: body.classes },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao salvar classes.")
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
    const payload = await updateIdentityTemplates(
      rpgConfigRouteDeps.accessService,
      rpgConfigRouteDeps.repository,
      { rpgId: request.params.rpgId, userId: auth.userId, fields: body.fields },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao salvar campos de identidade.")
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
      rpgConfigRouteDeps.accessService,
      rpgConfigRouteDeps.repository,
      { rpgId: request.params.rpgId, userId: auth.userId, fields: body.fields },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao salvar campos de caracteristicas.")
  }
}
