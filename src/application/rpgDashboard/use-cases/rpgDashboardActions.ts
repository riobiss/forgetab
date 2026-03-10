import type {
  DashboardCharacterSummary,
  RpgDashboardGateway,
} from "@/application/rpgDashboard/contracts/RpgDashboardGateway"

export async function requestToJoinRpgUseCase(
  gateway: RpgDashboardGateway,
  params: { rpgId: string },
) {
  return gateway.requestToJoinRpg(params.rpgId)
}

export async function processMemberRequestUseCase(
  gateway: RpgDashboardGateway,
  params: { rpgId: string; memberId: string; action: "accept" | "reject" | "toggleModerator" },
) {
  return gateway.processMemberRequest(params.rpgId, params.memberId, params.action)
}

export async function processCharacterRequestUseCase(
  gateway: RpgDashboardGateway,
  params: { rpgId: string; requestId: string; action: "accept" | "reject" },
) {
  return gateway.processCharacterRequest(params.rpgId, params.requestId, params.action)
}

export async function expelMemberUseCase(
  gateway: RpgDashboardGateway,
  params: { rpgId: string; memberId: string },
) {
  return gateway.expelMember(params.rpgId, params.memberId)
}

export async function toggleModeratorUseCase(
  gateway: RpgDashboardGateway,
  params: { rpgId: string; memberId: string },
) {
  return gateway.processMemberRequest(params.rpgId, params.memberId, "toggleModerator")
}

export async function loadDashboardDistributionUseCase(
  gateway: RpgDashboardGateway,
  params: { rpgId: string },
) {
  const [charactersPayload, classesPayload, rpgPayload] = await Promise.all([
    gateway.fetchCharacters(params.rpgId),
    gateway.fetchClasses(params.rpgId),
    gateway.fetchRpg(params.rpgId),
  ])

  return {
    charactersPayload,
    classesPayload,
    rpgPayload,
  }
}

export function mapPlayersWithClasses(params: {
  characters: DashboardCharacterSummary[]
  classes: Array<{ key: string; label: string }>
}) {
  const classLabelByKey = new Map(params.classes.map((item) => [item.key, item.label]))

  return params.characters
    .filter((item) => item.characterType === "player")
    .map((item) => ({
      id: item.id,
      userId: item.createdByUserId?.trim() || null,
      name: item.name,
      classLabel: item.classKey ? classLabelByKey.get(item.classKey) ?? item.classKey : "Sem classe",
    }))
}

export async function grantPointsUseCase(
  gateway: RpgDashboardGateway,
  params: { characterId: string; amount: number },
) {
  return gateway.grantPoints(params.characterId, params.amount)
}

export async function grantXpUseCase(
  gateway: RpgDashboardGateway,
  params: { characterId: string; amount: number },
) {
  return gateway.grantXp(params.characterId, params.amount)
}

