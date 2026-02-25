import { redirect } from "next/navigation"

type PageProps = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function CharacterSkillsBuilderPage({ params }: PageProps) {
  const { rpgId } = await params
  redirect(`/rpg/${rpgId}/skills`)
}
