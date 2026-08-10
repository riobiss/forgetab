import CharacterEditorPageClient from "@/features/world/characters/presentation/editor/CharacterEditorPageClient"

type PageProps = {
  params: Promise<{ rpgId: string }>
}

export default async function NewCharacterPage({ params }: PageProps) {
  const { rpgId } = await params

  return <CharacterEditorPageClient rpgId={rpgId} />
}
