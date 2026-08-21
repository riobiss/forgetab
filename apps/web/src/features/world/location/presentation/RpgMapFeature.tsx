import { RpgMapPage } from "@/features/world/location/presentation/RpgMapPage"

type RpgMapFeatureProps = {
  rpgId: string
  rpgTitle: string
  view?: "catalog" | "detail"
  initialMapId?: string | null
  initialFocusMarkerId?: string | null
  detailTitle?: string | null
}

export default function RpgMapFeature({
  rpgId,
  rpgTitle,
  view,
  initialMapId,
  initialFocusMarkerId,
  detailTitle
}: RpgMapFeatureProps) {
  return (
    <RpgMapPage
      rpgId={rpgId}
      rpgTitle={rpgTitle}
      view={view}
      initialMapId={initialMapId}
      initialFocusMarkerId={initialFocusMarkerId}
      detailTitle={detailTitle}
    />
  )
}
