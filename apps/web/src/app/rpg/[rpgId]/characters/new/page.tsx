import NewCharacterPageClient from "./NewCharacterPageClient"

type PageProps = {
  params: Promise<{ rpgId: string }>
}

export default async function NewCharacterPage({ params }: PageProps) {
  const { rpgId } = await params

  return <NewCharacterPageClient rpgId={rpgId} />
}
