import LibraryBookEditorFeature from "@/features/world/library/presentation/books/LibraryBookEditorFeature"
import { loadLibrarySectionPageData } from "@/features/world/library/presentation/server/loadLibraryPageData"

type Params = {
  params: Promise<{
    rpgId: string
    sectionId: string
  }>
}

export default async function NewLibraryBookPage({ params }: Params) {
  const { rpgId, sectionId } = await params
  const { sectionTitle } = await loadLibrarySectionPageData(rpgId, sectionId)

  return (
    <LibraryBookEditorFeature
      rpgId={rpgId}
      sectionTitle={sectionTitle}
      sectionId={sectionId}
      mode="create"
    />
  )
}
