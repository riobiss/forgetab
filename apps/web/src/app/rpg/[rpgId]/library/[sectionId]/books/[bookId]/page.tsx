import LibraryBookEditorFeature from "@/features/world/library/presentation/books/LibraryBookEditorFeature"
import { loadLibrarySectionPageData } from "@/features/world/library/presentation/server/loadLibraryPageData"

type Params = {
  params: Promise<{
    rpgId: string
    sectionId: string
    bookId: string
  }>
}

export default async function ViewLibraryBookPage({ params }: Params) {
  const { rpgId, sectionId, bookId } = await params
  const { sectionTitle } = await loadLibrarySectionPageData(rpgId, sectionId)

  return (
    <LibraryBookEditorFeature
      rpgId={rpgId}
      sectionTitle={sectionTitle}
      sectionId={sectionId}
      mode="edit"
      bookId={bookId}
    />
  )
}
