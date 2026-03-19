import { redirect } from "next/navigation"

type Props = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function EditRpgPage({ params }: Props) {
  const { rpgId } = await params
  redirect(`/rpg/${rpgId}?modal=edit&editor=rpg`)
}
