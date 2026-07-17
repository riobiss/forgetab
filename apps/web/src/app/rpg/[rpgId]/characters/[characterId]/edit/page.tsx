import EditCharacterPageClient from "./EditCharacterPageClient"

type PageProps = {
  params: Promise<{ rpgId: string; characterId: string }>
}

export default async function EditCharacterPage({ params }: PageProps) {
  const { rpgId, characterId } = await params

  return <EditCharacterPageClient rpgId={rpgId} characterId={characterId} />
}
