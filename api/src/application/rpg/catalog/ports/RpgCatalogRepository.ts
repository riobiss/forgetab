import type { RpgCatalogItem } from "@/application/rpg/catalog/types"

export type RpgCatalogRepository = {
  listOwnedByUser(userId: string): Promise<RpgCatalogItem[]>
  listPublicExcludingUser(userId: string | null): Promise<RpgCatalogItem[]>
}
