import type { FastifyReply, FastifyRequest } from "fastify"
import { getUserIdFromFastifyRequest } from "@api/presentation/http/auth/requestAuth"

export type SkillRouteParams = { id: string }
export type SkillLevelRouteParams = { id: string; levelId: string }

export async function requireUserId(request: FastifyRequest, reply: FastifyReply) {
  const userId = await getUserIdFromFastifyRequest(request)
  if (!userId) {
    reply.code(401)
    reply.header("Content-Type", "application/json; charset=utf-8")
    return {
      ok: false as const,
      response: reply.send({ message: "Usuario nao autenticado." }),
    }
  }

  return { ok: true as const, userId }
}
