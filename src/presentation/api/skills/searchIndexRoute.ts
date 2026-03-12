import { NextRequest, NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import {
  loadSkillsSearchIndexUseCase,
  normalizeSkillSearchIndexParams,
} from "@/application/skillsSearchIndex/use-cases/skillsSearchIndex"
import { prismaSkillsSearchIndexRepository } from "@/infrastructure/skillsSearchIndex/repositories/prismaSkillsSearchIndexRepository"
import { buildSkillsIndexTagList } from "@/presentation/api/skills/cacheTags"
import { getUserIdFromRequest } from "@/presentation/api/skills/requestAuth"

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const body = (await request.json()) as { skillIds?: unknown; rpgId?: unknown }
    const { skillIds, rpgId } = normalizeSkillSearchIndexParams(body)

    if (skillIds.length === 0) {
      return NextResponse.json({ index: {} }, { status: 200 })
    }

    const cacheKey = ["skills-search-index", userId, rpgId ?? "global", ...skillIds]
    const tags = buildSkillsIndexTagList({ userId, rpgId })
    const getCachedIndex = unstable_cache(
      async () => {
        return loadSkillsSearchIndexUseCase(
          { repository: prismaSkillsSearchIndexRepository },
          { userId, skillIds, rpgId },
        )
      },
      cacheKey,
      {
        revalidate: 60,
        tags,
      },
    )
    let index: Record<string, unknown>
    try {
      index = await getCachedIndex()
    } catch {
      index = await loadSkillsSearchIndexUseCase(
        { repository: prismaSkillsSearchIndexRepository },
        { userId, skillIds, rpgId },
      )
    }

    return NextResponse.json({ index }, { status: 200 })
  } catch {
    return NextResponse.json({ message: "Erro interno ao montar indice de busca." }, { status: 500 })
  }
}
