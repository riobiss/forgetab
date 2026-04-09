import { notFound } from "next/navigation"
import { fetchRpgDashboardViewModel, HttpApiError as DashboardHttpApiError } from "@/infrastructure/rpgDashboard/repositories/httpRpgDashboardViewModelRepository"
import {
  fetchRpgCampaignViewModel,
  HttpApiError as CampaignHttpApiError,
} from "@/infrastructure/rpgCampaign/repositories/httpRpgCampaignRepository"
import { RpgCampaignPage } from "@/presentation/rpg-campaign/RpgCampaignPage"

type Params = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function CampaignPageRoute({ params }: Params) {
  const { rpgId } = await params

  try {
    const [dashboard, campaigns] = await Promise.all([
      fetchRpgDashboardViewModel(rpgId),
      fetchRpgCampaignViewModel(rpgId),
    ])

    return (
      <RpgCampaignPage
        rpgId={rpgId}
        rpgTitle={dashboard.rpg.title}
        initialViewModel={campaigns}
      />
    )
  } catch (error) {
    if (
      (error instanceof DashboardHttpApiError && error.status === 404) ||
      (error instanceof CampaignHttpApiError && error.status === 404)
    ) {
      notFound()
    }

    throw error
  }
}
