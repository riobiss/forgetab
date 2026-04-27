import { notFound } from "next/navigation"
import { CreatureGatewayError, loadCreaturesDashboardPageUseCase } from "@/application/creatures"
import CreaturesDashboardPage from "@/presentation/creatures/CreaturesDashboardPage"
import { createCreaturesDependencies } from "@/infrastructure/creatures/dependencies"

type Props = {
  params: Promise<{ rpgId: string }>
}

export default async function CreaturesPage({ params }: Props) {
  const { rpgId } = await params
  const deps = createCreaturesDependencies("http")
  let data

  try {
    data = await loadCreaturesDashboardPageUseCase(deps, { rpgId })
  } catch (error) {
    if (error instanceof CreatureGatewayError && error.status === 404) {
      notFound()
    }
    throw error
  }

  return <CreaturesDashboardPage data={data} />
}
