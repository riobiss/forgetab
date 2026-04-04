import { notFound } from "next/navigation"
import { STATUS_CATALOG } from "@/lib/rpg/statusCatalog"
import type { RpgDashboardAccessService } from "@/application/rpgDashboard/ports/RpgDashboardAccessService"
import type {
  RpgDashboardRepository,
  SpectatorCharacterRow,
} from "@/application/rpgDashboard/ports/RpgDashboardRepository"
import type { RpgDashboardViewModel } from "@/application/rpgDashboard/types"

function normalizeNumericRecord(value: SpectatorCharacterRow["statuses"]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  const record = value as Record<string, unknown>
  return Object.fromEntries(
    Object.entries(record).map(([key, rawValue]) => [key, Number(rawValue) || 0]),
  )
}

function normalizeLegacyStatusKeys(record: Record<string, number>) {
  const normalized = { ...record }
  if (typeof normalized.stamina === "number" && typeof normalized.exhaustion !== "number") {
    normalized.exhaustion = normalized.stamina
  }
  delete normalized.stamina
  return normalized
}

const statusLabelByKey: Record<string, string> = Object.fromEntries(
  STATUS_CATALOG.map((item) => [item.key, item.label]),
)

export async function loadRpgDashboard(
  repository: RpgDashboardRepository,
  accessService: RpgDashboardAccessService,
  params: { rpgId: string; userId: string | null },
): Promise<RpgDashboardViewModel> {
  const dbRpg = await repository.getRpgById(params.rpgId)

  if (!dbRpg) {
    notFound()
  }

  const isAuthenticated = Boolean(params.userId)
  const permission =
    params.userId && params.userId.length > 0
      ? await accessService.getPermission(params.rpgId, params.userId)
      : null
  const isOwner = permission?.isOwner ?? false
  const canManageRpg = permission?.canManage ?? false

  let membershipStatus: "pending" | "accepted" | "rejected" | null = null
  if (params.userId && !isOwner) {
    membershipStatus = await accessService.getMembershipStatus(params.rpgId, params.userId)
  }

  const isAcceptedMember = membershipStatus === "accepted"
  const canViewFullContent = isOwner || isAcceptedMember

  if (dbRpg.visibility === "private" && !canViewFullContent) {
    notFound()
  }

  let pendingRequests = [] as RpgDashboardViewModel["pendingRequests"]
  let pendingCharacterRequests = [] as RpgDashboardViewModel["pendingCharacterRequests"]
  let acceptedMembers = [] as RpgDashboardViewModel["acceptedMembers"]
  let acceptedMembersCount = 0

  if (canManageRpg) {
    ;[pendingRequests, acceptedMembers, pendingCharacterRequests] = await Promise.all([
      repository.listPendingRequests(params.rpgId),
      repository.listAcceptedMembers(params.rpgId),
      repository.listPendingCharacterRequests(params.rpgId),
    ])
    acceptedMembersCount = acceptedMembers.length
  } else {
    acceptedMembersCount = await repository.countAcceptedMembers(params.rpgId)
  }

  const { hasRaces, hasClasses } = await repository.getTemplatesPresence(params.rpgId)

  let spectatorCharacters: RpgDashboardViewModel["spectatorCharacters"] = []
  let attributeLabels: Record<string, string> = {}
  let skillLabels: Record<string, string> = {}
  let statusLabels: Record<string, string> = {}

  if (isOwner) {
    try {
      const {
        charactersRows,
        attributeTemplateRows,
        skillTemplateRows,
        statusTemplateRows,
      } = await repository.getSpectatorVisionData(params.rpgId)

      const statusTemplateLabelByKey = Object.fromEntries(
        statusTemplateRows.map((item) => [item.key, item.label]),
      )

      spectatorCharacters = charactersRows.map((character) => {
        const statuses = normalizeLegacyStatusKeys(normalizeNumericRecord(character.statuses))
        const currentStatuses = normalizeLegacyStatusKeys(
          normalizeNumericRecord(character.currentStatuses),
        )
        const coreStatusConfig = [
          { key: "life", label: statusTemplateLabelByKey.life ?? "Vida" },
          {
            key: "mana",
            label: statusTemplateLabelByKey.mana ?? statusLabelByKey.mana ?? "Mana",
          },
          {
            key: "sanity",
            label: statusTemplateLabelByKey.sanity ?? statusLabelByKey.sanity ?? "Sanidade",
          },
          {
            key: "exhaustion",
            label:
              statusTemplateLabelByKey.exhaustion ??
              statusTemplateLabelByKey.stamina ??
              "Exaustão",
          },
        ]
        const extraStatusEntries = Object.entries(statuses).filter(
          ([key, value]) =>
            !coreStatusConfig.some((item) => item.key === key) && Number(value) > 0,
        )

        const statusItems = [
          ...coreStatusConfig.map((item) => ({
            key: item.key,
            label: item.label,
            max: Number(statuses[item.key] ?? 0),
            current:
              item.key === "life"
                ? Number(character.life ?? 0)
                : item.key === "mana"
                  ? Number(character.mana ?? 0)
                  : item.key === "sanity"
                    ? Number(character.sanity ?? 0)
                    : Number(character.exhaustion ?? 0),
          })),
          ...extraStatusEntries.map(([key, value]) => ({
            key,
            label: statusTemplateLabelByKey[key] ?? statusLabelByKey[key] ?? key,
            max: Number(value ?? 0),
            current: Math.max(
              0,
              Math.min(Number(value ?? 0), Number(currentStatuses[key] ?? value ?? 0)),
            ),
          })),
        ].filter((item) => item.max > 0)

        return {
          id: character.id,
          name: character.name,
          characterType: character.characterType,
          statusItems,
          attributes: normalizeNumericRecord(character.attributes),
          skills: normalizeNumericRecord(character.skills),
        }
      })

      attributeLabels = Object.fromEntries(attributeTemplateRows.map((item) => [item.key, item.label]))
      skillLabels = Object.fromEntries(skillTemplateRows.map((item) => [item.key, item.label]))
      statusLabels = Object.fromEntries(statusTemplateRows.map((item) => [item.key, item.label]))
    } catch {
      spectatorCharacters = []
      attributeLabels = {}
      skillLabels = {}
      statusLabels = {}
    }
  }

  return {
    rpg: dbRpg,
    isAuthenticated,
    isOwner,
    canManageRpg,
    membershipStatus,
    canViewFullContent,
    pendingRequests,
    pendingCharacterRequests,
    acceptedMembers,
    acceptedMembersCount,
    hasRaces,
    hasClasses,
    spectatorCharacters,
    attributeLabels,
    skillLabels,
    statusLabels,
  }
}

