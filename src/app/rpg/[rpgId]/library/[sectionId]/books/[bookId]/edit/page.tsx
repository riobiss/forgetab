import LibraryBookEditorFeature from "@/presentation/library/books/LibraryBookEditorFeature"
import { loadLibrarySectionShellData } from "../../../../loadLibraryShellData"

type Params = {
  params: Promise<{
    rpgId: string
    sectionId: string
    bookId: string
  }>
}

export default async function EditLibraryBookPage({ params }: Params) {
  const { rpgId, sectionId, bookId } = await params
  const { sectionTitle } = await loadLibrarySectionShellData(rpgId, sectionId)

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
