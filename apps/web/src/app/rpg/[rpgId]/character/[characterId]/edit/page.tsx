import { redirect } from "next/navigation"

type PageProps = {
  params: Promise<{ rpgId: string; characterId: string }>
}

export default async function EditCharacterAliasPage({ params }: PageProps) {
  const { rpgId, characterId } = await params
  redirect(`/rpg/${rpgId}/characters/${characterId}/edit`)
}
