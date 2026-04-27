import { notFound } from "next/navigation"
import { CreatureGatewayError, loadCreatureConfigPageUseCase } from "@/application/creatures"
import CreatureConfigPage from "@/presentation/creatures/CreatureConfigPage"
import { createCreaturesDependencies } from "@/infrastructure/creatures/dependencies"

type Props = {
  params: Promise<{ rpgId: string }>
}

export default async function CreatureConfigRoute({ params }: Props) {
  const { rpgId } = await params
  const deps = createCreaturesDependencies("http")
  let data

  try {
    data = await loadCreatureConfigPageUseCase(deps, { rpgId })
    if (!data) {
      notFound()
    }
  } catch (error) {
    if (error instanceof CreatureGatewayError && (error.status === 403 || error.status === 404)) {
      notFound()
    }
    throw error
  }

  return <CreatureConfigPage rpgId={rpgId} initialCategories={data.categories} />
}
