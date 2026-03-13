import { redirect } from "next/navigation"

type Props = {
  params: Promise<{
    rpgId: string
    itemId: string
  }>
}

export default async function EditItemPage({ params }: Props) {
  const { rpgId } = await params
  redirect(`/rpg/${rpgId}/items`)
}
