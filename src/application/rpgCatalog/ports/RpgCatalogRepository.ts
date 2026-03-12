import type { RpgCatalogItem } from "@/application/rpgCatalog/types"

export type RpgCatalogRepository = {
  listOwnedByUser(userId: string): Promise<RpgCatalogItem[]>
  listPublicExcludingUser(userId: string | null): Promise<RpgCatalogItem[]>
}
