export type PendingRequestSummary = {
  id: string
  userUsername: string
  userName: string
  requestedAt: Date
}

export type AcceptedMemberSummary = {
  id: string
  userId: string
  userUsername: string
  userName: string
  role: "member" | "moderator"
}

export type SpectatorStatusItem = {
  key: string
  label: string
  max: number
  current: number
}

export type SpectatorCharacterSummary = {
  id: string
  name: string
  characterType: "player" | "npc" | "monster"
  statusItems: SpectatorStatusItem[]
  attributes: Record<string, number>
  skills: Record<string, number>
}

export type RpgDashboardViewModel = {
  rpg: {
    id: string
    ownerId: string
    ownerName: string
    title: string
    description: string
    visibility: "private" | "public"
    useMundiMap: boolean
    usersCanManageOwnXp: boolean
    allowSkillPointDistribution: boolean
    createdAt: Date
  }
  isAuthenticated: boolean
  isOwner: boolean
  canManageRpg: boolean
  membershipStatus: "pending" | "accepted" | "rejected" | null
  canViewFullContent: boolean
  pendingRequests: PendingRequestSummary[]
  pendingCharacterRequests: PendingRequestSummary[]
  acceptedMembers: AcceptedMemberSummary[]
  acceptedMembersCount: number
  hasRaces: boolean
  hasClasses: boolean
  spectatorCharacters: SpectatorCharacterSummary[]
  attributeLabels: Record<string, string>
  skillLabels: Record<string, string>
  statusLabels: Record<string, string>
}

