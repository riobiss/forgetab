import { notFound } from "next/navigation"
import { CreatureGatewayError, loadEditCreaturePageUseCase } from "@/application/creatures"
import CreatureEditorPage from "@/presentation/creatures/CreatureEditorPage"
import { createCreaturesDependencies } from "@/infrastructure/creatures/dependencies"

type Props = {
  params: Promise<{ rpgId: string; creatureId: string }>
}

export default async function EditCreaturePage({ params }: Props) {
  const { rpgId, creatureId } = await params
  const deps = createCreaturesDependencies("http")
  let data

  try {
    data = await loadEditCreaturePageUseCase(deps, { rpgId, creatureId })
    if (!data) {
      notFound()
    }
  } catch (error) {
    if (error instanceof CreatureGatewayError && (error.status === 403 || error.status === 404)) {
      notFound()
    }
    throw error
  }

  return (
    <CreatureEditorPage
      rpgId={rpgId}
      bootstrap={data.bootstrap}
      categories={data.categories}
      creature={data.creature}
    />
  )
}
