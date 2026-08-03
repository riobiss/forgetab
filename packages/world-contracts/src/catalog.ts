export type RpgCatalogItem = {
  id: string
  title: string
  description: string
  image: string | null
  visibility: "private" | "public"
  createdAt: Date
}

export type RpgCatalogData = {
  userId: string | null
  createdRpgs: RpgCatalogItem[]
  publicRpgs: RpgCatalogItem[]
}

export type RpgCatalogRepository = {
  listOwnedByUser(userId: string): Promise<RpgCatalogItem[]>
  listPublicExcludingUser(userId: string | null): Promise<RpgCatalogItem[]>
}

export async function loadRpgCatalogUseCase(
  repository: RpgCatalogRepository,
  params: { userId: string | null },
): Promise<RpgCatalogData> {
  const [createdRpgs, publicRpgs] = await Promise.all([
    params.userId
      ? repository.listOwnedByUser(params.userId)
      : Promise.resolve([]),
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
