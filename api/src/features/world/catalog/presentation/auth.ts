import type { FastifyRequest } from "fastify"
import { getAuthPayloadFromFastifyRequest } from "@/features/http/presentation/auth/requestAuth"

export async function resolveUserId(request: FastifyRequest) {
  const authPayload = await getAuthPayloadFromFastifyRequest(request)
  return authPayload?.userId ?? null
}
