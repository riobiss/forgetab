import type { FastifyReply, FastifyRequest } from "fastify"
import {
  getAttributeTemplates,
  getCharacteristicTemplates,
  getClassTemplates,
  getIdentityTemplates,
  getRaceTemplates,
  getSkillTemplates,
  getStatusTemplates,
} from "@/application/rpg/config/use-cases/rpgConfig"
import { requireUserId, writeError, writeJson } from "@api/presentation/http/fastifyJson"
import { rpgConfigRouteDeps } from "./dependencies"
import type { RpgRouteParams } from "./routeTypes"

export async function getAttributeTemplatesHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response
    const payload = await getAttributeTemplates(
      rpgConfigRouteDeps.accessService,
      rpgConfigRouteDeps.repository,
      { rpgId: request.params.rpgId, userId: auth.userId },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao buscar atributos.")
  }
}

export async function getStatusTemplatesHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response
    const payload = await getStatusTemplates(
      rpgConfigRouteDeps.accessService,
      rpgConfigRouteDeps.repository,
      { rpgId: request.params.rpgId, userId: auth.userId },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao buscar status.")
  }
}

export async function getSkillTemplatesHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response
    const payload = await getSkillTemplates(
      rpgConfigRouteDeps.accessService,
      rpgConfigRouteDeps.repository,
      { rpgId: request.params.rpgId, userId: auth.userId },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao buscar pericias.")
  }
}

export async function getRaceTemplatesHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response
    const payload = await getRaceTemplates(
      rpgConfigRouteDeps.accessService,
      rpgConfigRouteDeps.repository,
      { rpgId: request.params.rpgId, userId: auth.userId },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao buscar racas.")
  }
}

export async function getClassTemplatesHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response
    const payload = await getClassTemplates(
      rpgConfigRouteDeps.accessService,
      rpgConfigRouteDeps.repository,
      { rpgId: request.params.rpgId, userId: auth.userId },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao buscar classes.")
  }
}

export async function getIdentityTemplatesHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response
    const payload = await getIdentityTemplates(
      rpgConfigRouteDeps.accessService,
      rpgConfigRouteDeps.repository,
      { rpgId: request.params.rpgId, userId: auth.userId },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao buscar campos de identidade.")
  }
}

export async function getCharacteristicTemplatesHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response
    const payload = await getCharacteristicTemplates(
      rpgConfigRouteDeps.accessService,
      rpgConfigRouteDeps.repository,
      { rpgId: request.params.rpgId, userId: auth.userId },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao buscar campos de caracteristicas.")
  }
}
