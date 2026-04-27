import { notFound } from "next/navigation"
import { CreatureGatewayError, loadNewCreaturePageUseCase } from "@/application/creatures"
import CreatureEditorPage from "@/presentation/creatures/CreatureEditorPage"
import { createCreaturesDependencies } from "@/infrastructure/creatures/dependencies"

type Props = {
  params: Promise<{ rpgId: string }>
}

export default async function NewCreaturePage({ params }: Props) {
  const { rpgId } = await params
  const deps = createCreaturesDependencies("http")
  let data

  try {
    data = await loadNewCreaturePageUseCase(deps, { rpgId })
    if (!data) {
      notFound()
    }
  } catch (error) {
    if (error instanceof CreatureGatewayError && (error.status === 403 || error.status === 404)) {
      notFound()
    }
    throw error
  }

  return <CreatureEditorPage rpgId={rpgId} bootstrap={data.bootstrap} categories={data.categories} />
}
