import RpgMapFeature from "@/features/world/location/presentation/RpgMapFeature"
import { loadMapShellData } from "@/features/world/location/presentation/server/loadMapShellData"

type Params = {
  params: Promise<{
    rpgId: string
    mapId: string
  }>
  searchParams?: Promise<{
    markerId?: string
  }>
}

export default async function MapDetailPage({ params, searchParams }: Params) {
  const { rpgId, mapId } = await params
  const query = await searchParams
  const shell = await loadMapShellData(rpgId, mapId)

  return (
    <main>
      <RpgMapFeature
        rpgId={rpgId}
        rpgTitle={shell.rpgTitle}
        view="detail"
        initialMapId={mapId}
        initialFocusMarkerId={query?.markerId ?? null}
        detailTitle={shell.mapTitle}
      />
    </main>
  )
}
