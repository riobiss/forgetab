import type { LibraryPageGateway } from "@/features/world/library/application/page/contracts/LibraryPageGateway"

export async function loadLibraryPage(
  gateway: LibraryPageGateway,
  params: { rpgId: string },
) {
  return { rpgTitle: await gateway.fetchRpgTitle(params.rpgId) }
}

export async function loadLibrarySectionPage(
  gateway: LibraryPageGateway,
  params: { rpgId: string; sectionId: string },
) {
  const [rpgTitle, sectionTitle] = await Promise.all([
    gateway.fetchRpgTitle(params.rpgId),
    gateway.fetchSectionTitle(params.rpgId, params.sectionId),
  ])

  return sectionTitle ? { rpgTitle, sectionTitle } : null
}
