import type { RpgCatalogRepository } from "@/application/rpgCatalog/ports/RpgCatalogRepository"
import type { RpgCatalogData } from "@/application/rpgCatalog/types"

export async function loadRpgCatalogUseCase(
  repository: RpgCatalogRepository,
  params: { userId: string | null },
): Promise<RpgCatalogData> {
  const [createdRpgs, publicRpgs] = await Promise.all([
    params.userId ? repository.listOwnedByUser(params.userId) : Promise.resolve([]),
    repository.listPublicExcludingUser(params.userId),
  ])

  return {
    userId: params.userId,
    createdRpgs,
    publicRpgs,
  }
}

export async function deleteRpgUseCase(
  deps: { gateway: { deleteRpg(rpgId: string): Promise<void> } },
  params: { rpgId: string },
) {
  await deps.gateway.deleteRpg(params.rpgId)
}
