import RpgMapFeature from "@/presentation/rpg-map/RpgMapFeature"
import { loadMapShellData } from "../loadMapShellData"

type Params = {
  params: Promise<{
    rpgId: string
    mapId: string
  }>
}

export default async function MapDetailPage({ params }: Params) {
  const { rpgId, mapId } = await params
  const shell = await loadMapShellData(rpgId, mapId)

  return (
    <main>
      <RpgMapFeature
        rpgId={rpgId}
        rpgTitle={shell.rpgTitle}
        view="detail"
        initialMapId={mapId}
        detailTitle={shell.mapTitle}
      />
    </main>
  )
}
