import {
  loadSkillsSearchIndexUseCase,
  normalizeSkillSearchIndexParams,
} from "@/application/skillsSearchIndex/use-cases/skillsSearchIndex"
import { prismaSkillsSearchIndexRepository } from "@/infrastructure/skillsSearchIndex/repositories/prismaSkillsSearchIndexRepository"
import { jsonResponse } from "@/backend/http/jsonResponse"
import { toErrorResponse } from "@/backend/shared/errors"
import { requireUserId } from "./shared"

export function getSkillsSearchIndexPayload(
  userId: string,
  skillIds: string[],
  rpgId?: string | null,
) {
  return loadSkillsSearchIndexUseCase(
    { repository: prismaSkillsSearchIndexRepository },
    { userId, skillIds, rpgId },
  )
}

export async function getSkillsSearchIndexHandler(request: Request) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = (await request.json()) as { skillIds?: unknown; rpgId?: unknown }
    const { skillIds, rpgId } = normalizeSkillSearchIndexParams(body)

    if (skillIds.length === 0) {
      return jsonResponse({ index: {} }, { status: 200 })
    }

    const index = await getSkillsSearchIndexPayload(auth.userId, skillIds, rpgId)
    return jsonResponse({ index }, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao montar indice de busca.")
  }
}
