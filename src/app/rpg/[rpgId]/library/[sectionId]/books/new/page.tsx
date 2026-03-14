import LibraryBookEditorFeature from "@/presentation/library/books/LibraryBookEditorFeature"
import { loadLibrarySectionShellData } from "../../../loadLibraryShellData"

type Params = {
  params: Promise<{
    rpgId: string
    sectionId: string
  }>
}

export default async function NewLibraryBookPage({ params }: Params) {
  const { rpgId, sectionId } = await params
  const { sectionTitle } = await loadLibrarySectionShellData(rpgId, sectionId)

  return (
    <LibraryBookEditorFeature
      rpgId={rpgId}
      sectionTitle={sectionTitle}
      sectionId={sectionId}
      mode="create"
    />
  )
}
