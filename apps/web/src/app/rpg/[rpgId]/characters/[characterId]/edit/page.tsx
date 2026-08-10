import CharacterEditorPageClient from "@/features/world/characters/presentation/editor/CharacterEditorPageClient"

type PageProps = {
  params: Promise<{ rpgId: string; characterId: string }>
}

export default async function EditCharacterPage({ params }: PageProps) {
  const { rpgId, characterId } = await params

  return <CharacterEditorPageClient rpgId={rpgId} characterId={characterId} />
}
