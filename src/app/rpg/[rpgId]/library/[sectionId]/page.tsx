import LibrarySectionBooksFeature from "@/presentation/library/LibrarySectionBooksFeature"

type Params = {
  params: Promise<{
    rpgId: string
    sectionId: string
  }>
}

export default async function LibraryBooksPage({ params }: Params) {
  const { rpgId, sectionId } = await params
  return (
    <LibrarySectionBooksFeature
      rpgId={rpgId}
      sectionId={sectionId}
      gatewayFactory="http"
    />
  )
}
