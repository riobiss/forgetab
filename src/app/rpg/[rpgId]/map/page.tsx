import RpgMapFeature from "@/presentation/rpg-map/RpgMapFeature"
import { loadMapShellData } from "./loadMapShellData"

type Params = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function MapPage({ params }: Params) {
  const { rpgId } = await params
  const shell = await loadMapShellData(rpgId)

  return <RpgMapFeature rpgId={rpgId} rpgTitle={shell.rpgTitle} />
}
