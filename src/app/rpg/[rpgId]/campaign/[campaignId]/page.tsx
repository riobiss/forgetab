import { notFound } from "next/navigation"
import {
  fetchRpgCampaignRoomViewModel,
  HttpApiError,
} from "@/infrastructure/rpgCampaign/repositories/httpRpgCampaignRepository"
import { RpgCampaignRoomPage } from "@/presentation/rpg-campaign/RpgCampaignRoomPage"

type Params = {
  params: Promise<{
    rpgId: string
    campaignId: string
  }>
}

export default async function CampaignRoomRoute({ params }: Params) {
  const { rpgId, campaignId } = await params
  const room = await fetchCampaignRoomOrNotFound(rpgId, campaignId)

  return <RpgCampaignRoomPage rpgId={rpgId} initialRoom={room} />
}

async function fetchCampaignRoomOrNotFound(rpgId: string, campaignId: string) {
  try {
    return await fetchRpgCampaignRoomViewModel(rpgId, campaignId)
  } catch (error) {
    if (error instanceof HttpApiError && error.status === 404) {
      notFound()
    }

    throw error
  }
}
