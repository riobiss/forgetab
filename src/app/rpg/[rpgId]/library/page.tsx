import LibrarySectionsFeature from "@/presentation/library/LibrarySectionsFeature"

type PageProps = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function LibrarySectionsPage({ params }: PageProps) {
  const { rpgId } = await params

  return <LibrarySectionsFeature rpgId={rpgId} gatewayFactory="http" />
}
