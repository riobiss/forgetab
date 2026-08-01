import { notFound } from "next/navigation"
import {
  loadLibraryPage,
  loadLibrarySectionPage,
} from "@/features/world/library/application/page/use-cases/loadLibraryPage"
import { httpLibraryPageGateway } from "@/features/world/library/infrastructure/page/gateways/httpLibraryPageGateway"

export async function loadLibraryPageData(rpgId: string) {
  try {
    return await loadLibraryPage(httpLibraryPageGateway, { rpgId })
  } catch {
    notFound()
  }
}

export async function loadLibrarySectionPageData(
  rpgId: string,
  sectionId: string,
) {
  try {
    const data = await loadLibrarySectionPage(httpLibraryPageGateway, {
      rpgId,
      sectionId,
    })
    if (!data) notFound()
    return data
  } catch {
    notFound()
  }
}
