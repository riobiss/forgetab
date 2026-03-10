export type MembershipStatus = "pending" | "accepted" | "rejected"
export type CharacterRequestStatus = "pending" | "accepted" | "rejected"

export type RpgSummary = {
  id: string
  ownerId: string
  visibility?: "private" | "public"
}

export type MemberUserSummary = {
  id: string
  username: string
  name: string
}

export type PendingCharacterRequestSummary = {
  id: string
  userId: string
  userUsername: string
  userName: string
  requestedAt: Date
}

export interface RpgMembershipRepository {
  getRpgSummary(rpgId: string): Promise<RpgSummary | null>
  getMembership(rpgId: string, userId: string): Promise<{ id: string; status: MembershipStatus } | null>
  listAllowedUsers(rpgId: string): Promise<MemberUserSummary[]>
  createPendingMembership(rpgId: string, userId: string): Promise<void>
  resendMembershipRequest(membershipId: string): Promise<void>
  toggleModerator(
    rpgId: string,
    memberId: string,
    ownerId: string,
  ): Promise<{ role: string } | null>
  processMembershipRequest(
    rpgId: string,
    memberId: string,
    nextStatus: "accepted" | "rejected",
  ): Promise<boolean>
  expelMember(rpgId: string, memberId: string, ownerId: string): Promise<boolean>
  listPendingCharacterRequests(rpgId: string): Promise<PendingCharacterRequestSummary[]>
  getCharacterRequest(
    rpgId: string,
    userId: string,
  ): Promise<{ id: string; status: CharacterRequestStatus } | null>
  createPendingCharacterRequest(rpgId: string, userId: string): Promise<void>
  resendCharacterRequest(requestId: string): Promise<void>
  processCharacterRequest(
    rpgId: string,
    requestId: string,
    nextStatus: "accepted" | "rejected",
  ): Promise<boolean>
}

