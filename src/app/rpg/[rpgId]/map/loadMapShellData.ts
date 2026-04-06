import { apiFetch } from "@/infrastructure/http/apiFetch"
import { fetchRpgDashboardViewModel } from "@/infrastructure/rpgDashboard/repositories/httpRpgDashboardViewModelRepository"

type ErrorPayload = {
  message?: string
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & ErrorPayload
  if (!response.ok) {
    throw new Error(payload.message ?? "Erro ao carregar mapas.")
  }
  return payload
}

export async function loadMapShellData(rpgId: string, mapId?: string) {
  let dashboard: Awaited<ReturnType<typeof fetchRpgDashboardViewModel>> | null = null

  try {
    dashboard = await fetchRpgDashboardViewModel(rpgId)
  } catch {
    return {
      rpgTitle: "RPG",
      mapTitle: null,
    }
  }

  let map = null
  if (mapId) {
    try {
      const payload = await parseJsonResponse<{ map?: { title: string } }>(
        await apiFetch(`/api/rpg/${rpgId}/maps/${mapId}`, {
          next: { revalidate: 0 },
          cache: "no-store",
        }),
      )
      map = payload.map ?? null
    } catch {
      map = null
    }
  }

  return {
    rpgTitle: dashboard.rpg.title,
    mapTitle: map?.title ?? null,
  }
}
