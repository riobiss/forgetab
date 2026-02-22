import BookEditorClient from "../BookEditorClient"

type Params = {
  params: Promise<{
    bookId: string
  }>
}

export default async function ViewLibraryBookPage({ params }: Params) {
  const { bookId } = await params
  return <BookEditorClient mode="edit" bookId={bookId} forceReadOnly />
}
