import type { RpgCatalogGateway } from "@/application/rpgCatalog/contracts/RpgCatalogGateway"

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string }
  if (!response.ok) {
    throw new Error(payload.message ?? "Erro na requisicao.")
  }
  return payload
}

export const httpRpgCatalogGateway: RpgCatalogGateway = {
  async deleteRpg(rpgId) {
    const response = await fetch(`/api/rpg/${rpgId}`, { method: "DELETE" })
    await parseJson<{ message?: string }>(response)
  },
}
