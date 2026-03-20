import { RpgMapPage } from "@/presentation/rpg-map/RpgMapPage"

type RpgMapFeatureProps = {
  rpgId: string
  rpgTitle: string
  view?: "catalog" | "detail"
  initialMapId?: string | null
  detailTitle?: string | null
}

export default function RpgMapFeature({ rpgId, rpgTitle, view, initialMapId, detailTitle }: RpgMapFeatureProps) {
  return <RpgMapPage rpgId={rpgId} rpgTitle={rpgTitle} view={view} initialMapId={initialMapId} detailTitle={detailTitle} />
}
