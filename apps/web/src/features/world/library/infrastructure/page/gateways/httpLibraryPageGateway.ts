import type { LibraryPageGateway } from "@/features/world/library/application/page/contracts/LibraryPageGateway"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { createApiResponseParser } from "@/features/http/infrastructure/parseApiResponse"
import { fetchRpgDashboardViewModel } from "@/features/world/infrastructure/dashboard/repositories/httpRpgDashboardViewModelRepository"

const parseJsonResponse = createApiResponseParser({
  fallbackMessage: "Erro ao carregar biblioteca.",
})

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
