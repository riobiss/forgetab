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
  const { dashboard, campaigns } = await fetchCampaignPageDataOrNotFound(rpgId)

  return (
    <RpgCampaignPage
      rpgId={rpgId}
      rpgTitle={dashboard.rpg.title}
      initialViewModel={campaigns}
    />
  )
}

async function fetchCampaignPageDataOrNotFound(rpgId: string) {
  try {
    const dashboard = await fetchRpgDashboardViewModel(rpgId)
    const campaigns = await fetchRpgCampaignViewModel(rpgId).catch((error) => {
      if (error instanceof CampaignHttpApiError && error.status === 404) {
        return {
          isOwner: dashboard.isOwner,
          canManage: dashboard.canManageRpg,
          isAcceptedMember: dashboard.membershipStatus === "accepted",
          activeCampaignId: null,
          viewerJoinedActiveCampaign: false,
          campaigns: [],
          activeParticipants: [],
          activeMessages: [],
        }
      }

      throw error
    })

    return { dashboard, campaigns }
  } catch (error) {
    if (error instanceof DashboardHttpApiError && error.status === 404) {
      notFound()
    }

    throw error
  }
}
