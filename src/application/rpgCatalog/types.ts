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
