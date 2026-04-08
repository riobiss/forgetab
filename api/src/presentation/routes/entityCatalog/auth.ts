import type { FastifyRequest } from "fastify"
import { getAuthPayloadFromFastifyRequest } from "@api/presentation/http/auth/requestAuth"

export async function resolveUserId(request: FastifyRequest) {
  const authPayload = await getAuthPayloadFromFastifyRequest(request)
  return authPayload?.userId ?? null
}
