import { redirect } from "next/navigation"

type PageProps = {
  params: Promise<{ rpgId: string }>
}

export default async function NewCharacterAliasPage({ params }: PageProps) {
  const { rpgId } = await params
  redirect(`/rpg/${rpgId}/characters/new`)
}
