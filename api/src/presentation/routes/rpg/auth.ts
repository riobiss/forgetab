import type { FastifyReply, FastifyRequest } from "fastify"
import { getAuthPayloadFromFastifyRequest } from "@api/presentation/http/auth/requestAuth"
import { writeJson } from "@api/presentation/http/fastifyJson"

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const authPayload = await getAuthPayloadFromFastifyRequest(request)
  if (!authPayload) {
    return {
      ok: false as const,
      response: writeJson(reply, 401, { message: "Usuario nao autenticado." }),
    }
  }

  return { ok: true as const, authPayload }
}

export async function resolveOptionalUserId(request: FastifyRequest) {
  const authPayload = await getAuthPayloadFromFastifyRequest(request)
  return authPayload?.userId ?? null
}
