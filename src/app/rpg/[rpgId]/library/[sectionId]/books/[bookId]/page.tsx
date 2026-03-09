import LibraryBookEditorFeature from "@/presentation/library/books/LibraryBookEditorFeature"

type Params = {
  params: Promise<{
    rpgId: string
    sectionId: string
    bookId: string
  }>
}

export default async function ViewLibraryBookPage({ params }: Params) {
  const { rpgId, sectionId, bookId } = await params
  return (
    <LibraryBookEditorFeature
      rpgId={rpgId}
      sectionId={sectionId}
      mode="edit"
      bookId={bookId}
      forceReadOnly
    />
  )
}
