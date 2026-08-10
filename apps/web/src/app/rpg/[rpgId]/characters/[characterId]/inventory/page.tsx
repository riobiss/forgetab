import { redirect } from "next/navigation"

type Params = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

export default async function InventoryPage({ params }: Params) {
  const { rpgId, characterId } = await params
  redirect(`/rpg/${rpgId}/characters/${characterId}/items`)
}
