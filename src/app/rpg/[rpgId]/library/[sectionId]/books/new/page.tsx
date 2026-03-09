import LibraryBookEditorFeature from "@/presentation/library/books/LibraryBookEditorFeature"

type Params = {
  params: Promise<{
    rpgId: string
    sectionId: string
  }>
}

export default async function NewLibraryBookPage({ params }: Params) {
  const { rpgId, sectionId } = await params
  return <LibraryBookEditorFeature rpgId={rpgId} sectionId={sectionId} mode="create" />
}
