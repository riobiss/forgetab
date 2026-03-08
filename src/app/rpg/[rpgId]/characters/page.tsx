import { notFound } from "next/navigation"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { prismaRpgAccessRepository } from "@/infrastructure/characters/repositories/prismaRpgAccessRepository"
import { prismaCharactersDashboardRepository } from "@/infrastructure/charactersDashboard/repositories/prismaCharactersDashboardRepository"
import CharactersDashboardPage from "@/presentation/characters-dashboard/CharactersDashboardPage"
import {
  loadCharactersDashboardUseCase,
} from "@/application/charactersDashboard/use-cases/loadCharactersDashboard"
import type { CharactersDashboardFilterType } from "@/application/charactersDashboard/types"

type Params = {
  params: Promise<{
    rpgId: string
  }>
  searchParams: Promise<{
    type?: string
  }>
}

function normalizeFilterType(value?: string): CharactersDashboardFilterType {
  return value === "player" || value === "npc" || value === "monster" ? value : "all"
}

export default async function CharactersPage({ params, searchParams }: Params) {
  const { rpgId } = await params
  const resolvedSearchParams = await searchParams
  const userId = await getUserIdFromCookieStore()

  const result = await loadCharactersDashboardUseCase(
    {
      dashboardRepository: prismaCharactersDashboardRepository,
      rpgAccessRepository: prismaRpgAccessRepository,
    },
    {
      rpgId,
      userId,
      filterType: normalizeFilterType(resolvedSearchParams?.type),
    },
  )

  if (result.status === "not_found" || result.status === "private_blocked") {
    notFound()
  }

  return <CharactersDashboardPage data={result.data} />
}
