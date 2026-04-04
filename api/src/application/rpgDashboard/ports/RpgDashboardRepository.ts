import type { Prisma } from "../../../../generated/prisma/client.js"
import type {
  AcceptedMemberSummary,
  PendingRequestSummary,
} from "@/application/rpgDashboard/types"

export type DbRpgRow = {
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

export type CountRow = {
  total: bigint | number
}

export type SpectatorCharacterRow = {
  id: string
  name: string
  characterType: "player" | "npc" | "monster"
  life: number
  mana: number
  sanity: number
  exhaustion: number
  statuses: Prisma.JsonValue
  currentStatuses: Prisma.JsonValue
  attributes: Prisma.JsonValue
  skills: Prisma.JsonValue
}

export type TemplateLabelRow = {
  key: string
  label: string
}

export interface RpgDashboardRepository {
  getRpgById(rpgId: string): Promise<DbRpgRow | null>
  listPendingRequests(rpgId: string): Promise<PendingRequestSummary[]>
  listPendingCharacterRequests(rpgId: string): Promise<PendingRequestSummary[]>
  listAcceptedMembers(rpgId: string): Promise<AcceptedMemberSummary[]>
  countAcceptedMembers(rpgId: string): Promise<number>
  getTemplatesPresence(rpgId: string): Promise<{ hasRaces: boolean; hasClasses: boolean }>
  getSpectatorVisionData(rpgId: string): Promise<{
    charactersRows: SpectatorCharacterRow[]
    attributeTemplateRows: TemplateLabelRow[]
    skillTemplateRows: TemplateLabelRow[]
    statusTemplateRows: TemplateLabelRow[]
  }>
}

