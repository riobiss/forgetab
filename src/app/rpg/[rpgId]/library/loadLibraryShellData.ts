import { notFound } from "next/navigation"
import { apiFetch } from "@/infrastructure/http/apiFetch"
import { fetchRpgDashboardViewModel } from "@/infrastructure/rpgDashboard/repositories/httpRpgDashboardViewModelRepository"

type ErrorPayload = {
  message?: string
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & ErrorPayload
  if (!response.ok) {
    throw new Error(payload.message ?? "Erro ao carregar biblioteca.")
  }
  return payload
}

export async function loadLibraryShellData(rpgId: string) {
  try {
    const dashboard = await fetchRpgDashboardViewModel(rpgId)

    return {
      rpgTitle: dashboard.rpg.title,
    }
  } catch {
    notFound()
  }
}

export async function loadLibrarySectionShellData(rpgId: string, sectionId: string) {
  try {
    const [shell, payload] = await Promise.all([
      loadLibraryShellData(rpgId),
      parseJsonResponse<{ section?: { title: string } }>(
        await apiFetch(`/api/rpg/${rpgId}/library/sections/${sectionId}`, {
          next: { revalidate: 0 },
          cache: "no-store",
        }),
      ),
    ])

    if (!payload.section) {
      notFound()
    }

    return {
      ...shell,
      sectionTitle: payload.section.title,
    }
  } catch {
    notFound()
  }
}
