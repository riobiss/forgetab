import LibrarySectionsFeature from "@/presentation/library/LibrarySectionsFeature"
import { loadLibraryShellData } from "./loadLibraryShellData"

type PageProps = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function LibrarySectionsPage({ params }: PageProps) {
  const { rpgId } = await params
  const { rpgTitle } = await loadLibraryShellData(rpgId)

  return <LibrarySectionsFeature rpgId={rpgId} rpgTitle={rpgTitle} gatewayFactory="http" />
}
