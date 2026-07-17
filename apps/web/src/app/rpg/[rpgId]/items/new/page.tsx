import { redirect } from "next/navigation"

type Props = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function NewItemPage({ params }: Props) {
  const { rpgId } = await params
  redirect(`/rpg/${rpgId}/items`)
}
