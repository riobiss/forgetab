import { notFound } from "next/navigation"
import CharacterInventoryFeature from "@/features/world/characters/presentation/inventory/CharacterInventoryFeature"

type Params = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

export default async function InventoryPage({ params }: Params) {
  const { rpgId, characterId } = await params

  if (!characterId) {
    notFound()
  }

  return (
    <CharacterInventoryFeature
      rpgId={rpgId}
      characterId={characterId}
      gatewayFactory="http"
    />
  )
}
