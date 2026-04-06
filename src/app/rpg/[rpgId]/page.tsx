import { notFound } from "next/navigation"
import {
  fetchRpgDashboardViewModel,
  HttpApiError,
} from "@/infrastructure/rpgDashboard/repositories/httpRpgDashboardViewModelRepository"
import { RpgDashboardPage } from "@/presentation/rpg-dashboard/RpgDashboardPage"

type Params = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function ViewInRpg({ params }: Params) {
  const { rpgId } = await params
  let viewModel

  try {
    viewModel = await fetchRpgDashboardViewModel(rpgId)
  } catch (error) {
    if (error instanceof HttpApiError && error.status === 404) {
      notFound()
    }

    throw error
  }

  return <RpgDashboardPage viewModel={viewModel} />
}
