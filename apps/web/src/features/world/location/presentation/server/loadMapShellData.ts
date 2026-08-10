import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { fetchRpgDashboardViewModel } from "@/features/world/infrastructure/dashboard/repositories/httpRpgDashboardViewModelRepository"
import { parseApiResponse } from "@/features/http/infrastructure/parseApiResponse"

export async function loadMapShellData(rpgId: string, mapId?: string) {
  let dashboard: Awaited<ReturnType<typeof fetchRpgDashboardViewModel>> | null =
    null

  try {
    dashboard = await fetchRpgDashboardViewModel(rpgId)
  } catch {
    return {
      rpgTitle: "RPG",
      mapTitle: null
    }
  }

  let map = null
  if (mapId) {
    try {
      const payload = await parseApiResponse<{ map?: { title: string } }>(
        await apiFetch(`/api/rpg/${rpgId}/maps/${mapId}`, {
          next: { revalidate: 0 },
          cache: "no-store"
        }),
        { fallbackMessage: "Erro ao carregar mapas." }
      )
      map = payload.map ?? null
    } catch {
      map = null
    }
  }

  return {
    rpgTitle: dashboard.rpg.title,
    mapTitle: map?.title ?? null
  }
}
