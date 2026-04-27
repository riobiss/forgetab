import { notFound } from "next/navigation"
import { CreatureGatewayError, loadCreatureDetailPageUseCase } from "@/application/creatures"
import CreatureDetailPage from "@/presentation/creatures/CreatureDetailPage"
import { createCreaturesDependencies } from "@/infrastructure/creatures/dependencies"

type Props = {
  params: Promise<{ rpgId: string; creatureId: string }>
}

export default async function CreatureDetailRoute({ params }: Props) {
  const { rpgId, creatureId } = await params
  const deps = createCreaturesDependencies("http")
  let data

  try {
    data = await loadCreatureDetailPageUseCase(deps, { rpgId, creatureId })
    if (!data) {
      notFound()
    }
  } catch (error) {
    if (error instanceof CreatureGatewayError && (error.status === 403 || error.status === 404)) {
      notFound()
    }
    throw error
  }

  return <CreatureDetailPage rpgId={rpgId} creature={data.creature} categories={data.categories} />
}
