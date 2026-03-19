import { RpgMapPage } from "@/presentation/rpg-map/RpgMapPage"

type RpgMapFeatureProps = {
  rpgId: string
  rpgTitle: string
}

export default function RpgMapFeature({ rpgId, rpgTitle }: RpgMapFeatureProps) {
  return <RpgMapPage rpgId={rpgId} rpgTitle={rpgTitle} />
}
