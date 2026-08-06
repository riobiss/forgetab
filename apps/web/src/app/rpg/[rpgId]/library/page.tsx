import LibrarySectionsFeature from "@/features/world/library/presentation/LibrarySectionsFeature"
import { loadLibraryPageData } from "@/features/world/library/presentation/server/loadLibraryPageData"

type PageProps = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function LibrarySectionsPage({ params }: PageProps) {
  const { rpgId } = await params
  const { rpgTitle } = await loadLibraryPageData(rpgId)

  return (
    <LibrarySectionsFeature
      rpgId={rpgId}
      rpgTitle={rpgTitle}
      gatewayFactory="http"
    />
  )
}
