import type { LibraryPageGateway } from "@/features/world/library/application/page/contracts/LibraryPageGateway"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { fetchRpgDashboardViewModel } from "@/features/world/infrastructure/dashboard/repositories/httpRpgDashboardViewModelRepository"

type ErrorPayload = { message?: string }

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & ErrorPayload
  if (!response.ok) {
    throw new Error(payload.message ?? "Erro ao carregar biblioteca.")
  }
  return payload
}

export const httpLibraryPageGateway: LibraryPageGateway = {
  async fetchRpgTitle(rpgId) {
    const dashboard = await fetchRpgDashboardViewModel(rpgId)
    return dashboard.rpg.title
  },

  async fetchSectionTitle(rpgId, sectionId) {
    const payload = await parseJsonResponse<{ section?: { title: string } }>(
      await apiFetch(`/api/rpg/${rpgId}/library/sections/${sectionId}`, {
        next: { revalidate: 0 },
        cache: "no-store",
      }),
    )
    return payload.section?.title ?? null
  },
}
