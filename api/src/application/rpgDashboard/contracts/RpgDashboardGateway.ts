export type DashboardCharacterSummary = {
  id: string
  name: string
  classKey: string | null
  characterType: "player" | "npc" | "monster"
  createdByUserId?: string | null
}

export type DashboardClassSummary = {
  key: string
  label: string
}

export interface RpgDashboardGateway {
  requestToJoinRpg(rpgId: string): Promise<{ message?: string }>
  processMemberRequest(
    rpgId: string,
    memberId: string,
    action: "accept" | "reject" | "toggleModerator",
  ): Promise<{ message?: string; role?: string }>
  processCharacterRequest(
    rpgId: string,
    requestId: string,
    action: "accept" | "reject",
  ): Promise<{ message?: string }>
  expelMember(rpgId: string, memberId: string): Promise<{ message?: string }>
  fetchCharacters(rpgId: string): Promise<{ characters?: DashboardCharacterSummary[]; message?: string }>
  fetchClasses(rpgId: string): Promise<{ classes?: DashboardClassSummary[]; message?: string }>
  fetchRpg(rpgId: string): Promise<{ rpg?: { costResourceName?: string }; message?: string }>
  grantPoints(
    characterId: string,
    amount: number,
  ): Promise<{ success?: boolean; message?: string; remainingPoints?: number }>
  grantXp(
    characterId: string,
    amount: number,
  ): Promise<{
    success?: boolean
    message?: string
    progressionCurrent?: number
    progressionLabel?: string
    progressionRequired?: number
  }>
}

