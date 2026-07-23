import type { RpgCatalogItem } from "@/features/world/application/catalog/types"

export type RpgCatalogRepository = {
  listOwnedByUser(userId: string): Promise<RpgCatalogItem[]>
  listPublicExcludingUser(userId: string | null): Promise<RpgCatalogItem[]>
}
