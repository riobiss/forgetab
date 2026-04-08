import type { FastifyReply, FastifyRequest } from "fastify"
import {
  loadSkillsSearchIndexUseCase,
  normalizeSkillSearchIndexParams,
} from "@/application/skillsSearchIndex/use-cases/skillsSearchIndex"
import { parseJsonBody, writeError, writeJson } from "@api/presentation/http/fastifyJson"
import { skillRouteDeps } from "./dependencies"
import { requireUserId } from "./shared"

export function getSkillsSearchIndexPayload(userId: string, skillIds: string[], rpgId?: string | null) {
  return loadSkillsSearchIndexUseCase(
    { repository: skillRouteDeps.searchIndexRepository },
    { userId, skillIds, rpgId },
  )
}

export async function getSkillsSearchIndexHandler(request: FastifyRequest, reply: FastifyReply) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) return auth.response

  try {
    const body = parseJsonBody(request.body) as { skillIds?: unknown; rpgId?: unknown }
    const { skillIds, rpgId } = normalizeSkillSearchIndexParams(body)

    if (skillIds.length === 0) {
      return writeJson(reply, 200, { index: {} })
    }

    const index = await getSkillsSearchIndexPayload(auth.userId, skillIds, rpgId)
    return writeJson(reply, 200, { index })
  } catch (error) {
    return writeError(reply, error, "Erro interno ao montar indice de busca.")
  }
}
