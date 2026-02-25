import { notFound } from "next/navigation"
import styles from "./page.module.css"
import Image from "next/image"
import Link from "next/link"
import { Settings } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Prisma } from "../../../../generated/prisma/client.js"
import MembershipNotifications from "./components/MembershipNotifications"
import MembersList from "./components/MembersList"
import QuickCreateMenu from "./components/QuickCreateMenu"
import RpgInfoModalButton from "./components/RpgInfoModalButton"
import SpectatorVisionPanel from "./components/SpectatorVisionPanel"
import { STATUS_CATALOG } from "@/lib/rpg/statusCatalog"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { getMembershipStatus } from "@/lib/server/rpgAccess"
import { getRpgPermission } from "@/lib/server/rpgPermissions"

type Params = {
  params: Promise<{
    rpgId: string
  }>
}

type PendingRequestRow = {
  id: string
  userUsername: string
  userName: string
  requestedAt: Date
}

type PendingCharacterRequestRow = {
  id: string
  userUsername: string
  userName: string
  requestedAt: Date
}

type AcceptedMemberRow = {
  id: string
  userId: string
  userUsername: string
  userName: string
  role: "member" | "moderator"
}

type CountRow = {
  total: bigint | number
}

type SpectatorCharacterRow = {
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

type TemplateLabelRow = {
  key: string
  label: string
}

type DbRpgRow = {
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

function truncateText(text: string, limit: number) {
  if (text.length <= limit) return text
  return `${text.slice(0, limit).trimEnd()}...`
}

function normalizeNumericRecord(value: Prisma.JsonValue): Record<string, number> {
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

export default async function ViewInRpg({ params }: Params) {
  const { rpgId } = await params

  let rows: DbRpgRow[] = []
  try {
    rows = await prisma.$queryRaw<DbRpgRow[]>(Prisma.sql`
      SELECT
        r.id,
        r.owner_id AS "ownerId",
        COALESCE(u.name, u.username, 'Mestre') AS "ownerName",
        r.title,
        r.description,
        r.visibility,
        COALESCE(r.use_mundi_map, false) AS "useMundiMap",
        COALESCE(r.users_can_manage_own_xp, true) AS "usersCanManageOwnXp",
        COALESCE(r.allow_skill_point_distribution, true) AS "allowSkillPointDistribution",
        r.created_at AS "createdAt"
      FROM rpgs r
      LEFT JOIN users u ON u.id = r.owner_id
      WHERE r.id = ${rpgId}
      LIMIT 1
    `)
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('column "use_mundi_map" does not exist') ||
        error.message.includes('column "users_can_manage_own_xp" does not exist') ||
        error.message.includes('column "allow_skill_point_distribution" does not exist'))
    ) {
      rows = await prisma.$queryRaw<DbRpgRow[]>(Prisma.sql`
        SELECT
          r.id,
          r.owner_id AS "ownerId",
          COALESCE(u.name, u.username, 'Mestre') AS "ownerName",
          r.title,
          r.description,
          r.visibility,
          false AS "useMundiMap",
          true AS "usersCanManageOwnXp",
          true AS "allowSkillPointDistribution",
          r.created_at AS "createdAt"
        FROM rpgs r
        LEFT JOIN users u ON u.id = r.owner_id
        WHERE r.id = ${rpgId}
        LIMIT 1
      `)
    } else {
      throw error
    }
  }

  const dbRpg = rows[0]

  if (!dbRpg) {
    notFound()
  }

  const userId = await getUserIdFromCookieStore()
  const isAuthenticated = Boolean(userId)
  const permission =
    userId && userId.length > 0 ? await getRpgPermission(rpgId, userId) : null
  const isOwner = permission?.isOwner ?? false
  const canManageRpg = permission?.canManage ?? false

  let membershipStatus: "pending" | "accepted" | "rejected" | null = null
  if (userId && !isOwner) {
    membershipStatus = await getMembershipStatus(rpgId, userId)
  }

  const isAcceptedMember = membershipStatus === "accepted"
  const canViewFullContent = isOwner || isAcceptedMember

  if (dbRpg.visibility === "private" && !canViewFullContent) {
    notFound()
  }

  let pendingRequests: PendingRequestRow[] = []
  let pendingCharacterRequests: PendingCharacterRequestRow[] = []
  let acceptedMembers: AcceptedMemberRow[] = []
  let acceptedMembersCount = 0
  let hasRaces = false
  let hasClasses = false
  let spectatorCharacters: Array<{
    id: string
    name: string
    characterType: "player" | "npc" | "monster"
    statusItems: Array<{
      key: string
      label: string
      max: number
      current: number
    }>
    attributes: Record<string, number>
    skills: Record<string, number>
  }> = []
  let attributeLabels: Record<string, string> = {}
  let skillLabels: Record<string, string> = {}
  let statusLabels: Record<string, string> = {}

  if (canManageRpg) {
    pendingRequests = await prisma.$queryRaw<PendingRequestRow[]>(Prisma.sql`
      SELECT
        m.id,
        u.username AS "userUsername",
        u.name AS "userName",
        m.requested_at AS "requestedAt"
      FROM rpg_members m
      INNER JOIN users u ON u.id = m.user_id
      WHERE m.rpg_id = ${rpgId}
        AND m.status = 'pending'::"public"."RpgMemberStatus"
      ORDER BY m.requested_at ASC
    `)

    acceptedMembers = await prisma.$queryRaw<AcceptedMemberRow[]>(Prisma.sql`
      SELECT
        m.id,
        m.user_id AS "userId",
        u.username AS "userUsername",
        u.name AS "userName",
        m.role::text AS role
      FROM rpg_members m
      INNER JOIN users u ON u.id = m.user_id
      WHERE m.rpg_id = ${rpgId}
        AND m.status = 'accepted'::"public"."RpgMemberStatus"
      ORDER BY u.name ASC
    `)
    acceptedMembersCount = acceptedMembers.length

    pendingCharacterRequests = await prisma.$queryRaw<PendingCharacterRequestRow[]>(Prisma.sql`
      SELECT
        r.id,
        u.username AS "userUsername",
        u.name AS "userName",
        r.requested_at AS "requestedAt"
      FROM rpg_character_creation_requests r
      INNER JOIN users u ON u.id = r.user_id
      WHERE r.rpg_id = ${rpgId}
        AND r.status = 'pending'::"public"."CharacterCreationRequestStatus"
      ORDER BY r.requested_at ASC
    `)
  } else {
    const acceptedCountRows = await prisma.$queryRaw<CountRow[]>(Prisma.sql`
      SELECT COUNT(*) AS total
      FROM rpg_members
      WHERE rpg_id = ${rpgId}
        AND status = 'accepted'::"public"."RpgMemberStatus"
    `)
    acceptedMembersCount = Number(acceptedCountRows[0]?.total ?? 0)
  }

  try {
    const raceCount = await prisma.$queryRaw<CountRow[]>(Prisma.sql`
      SELECT COUNT(*) AS total
      FROM rpg_race_templates
      WHERE rpg_id = ${rpgId}
    `)
    const classCount = await prisma.$queryRaw<CountRow[]>(Prisma.sql`
      SELECT COUNT(*) AS total
      FROM rpg_class_templates
      WHERE rpg_id = ${rpgId}
    `)

    hasRaces = Number(raceCount[0]?.total ?? 0) > 0
    hasClasses = Number(classCount[0]?.total ?? 0) > 0
  } catch {
    hasRaces = false
    hasClasses = false
  }

  if (isOwner) {
    try {
      const [charactersRows, attributeTemplateRows, skillTemplateRows, statusTemplateRows] =
        await Promise.all([
        prisma.$queryRaw<SpectatorCharacterRow[]>(Prisma.sql`
          SELECT
            c.id,
            c.name,
            c.character_type AS "characterType",
            c.life,
            c.mana,
            c.sanity,
            c.stamina AS exhaustion,
            COALESCE(c.statuses, '{}'::jsonb) AS statuses,
            COALESCE(c.current_statuses, '{}'::jsonb) AS "currentStatuses",
            COALESCE(c.attributes, '{}'::jsonb) AS attributes,
            COALESCE(c.skills, '{}'::jsonb) AS skills
          FROM rpg_characters c
          WHERE c.rpg_id = ${rpgId}
          ORDER BY c.created_at DESC
        `),
        prisma.$queryRaw<TemplateLabelRow[]>(Prisma.sql`
          SELECT key, label
          FROM rpg_attribute_templates
          WHERE rpg_id = ${rpgId}
          ORDER BY position ASC
        `),
        prisma.$queryRaw<TemplateLabelRow[]>(Prisma.sql`
          SELECT key, label
          FROM rpg_skill_templates
          WHERE rpg_id = ${rpgId}
          ORDER BY position ASC
        `),
        prisma.$queryRaw<TemplateLabelRow[]>(Prisma.sql`
          SELECT key, label
          FROM rpg_status_templates
          WHERE rpg_id = ${rpgId}
          ORDER BY position ASC
        `),
      ])

      const statusTemplateLabelByKey = Object.fromEntries(
        statusTemplateRows.map((item) => [item.key, item.label]),
      )

      spectatorCharacters = charactersRows.map((character) => {
        const statuses = normalizeLegacyStatusKeys(normalizeNumericRecord(character.statuses))
        const currentStatuses = normalizeLegacyStatusKeys(
          normalizeNumericRecord(character.currentStatuses),
        )
        const coreStatusConfig = [
          {
            key: "life",
            label: statusTemplateLabelByKey.life ?? "Vida",
          },
          {
            key: "mana",
            label: statusTemplateLabelByKey.mana ?? statusLabelByKey.mana ?? "Mana",
          },
          {
            key: "sanity",
            label:
              statusTemplateLabelByKey.sanity ?? statusLabelByKey.sanity ?? "Sanidade",
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
      attributeLabels = Object.fromEntries(
        attributeTemplateRows.map((item) => [item.key, item.label]),
      )
      skillLabels = Object.fromEntries(skillTemplateRows.map((item) => [item.key, item.label]))
      statusLabels = Object.fromEntries(statusTemplateRows.map((item) => [item.key, item.label]))
    } catch {
      spectatorCharacters = []
      attributeLabels = {}
      skillLabels = {}
      statusLabels = {}
    }
  }

  if (!canViewFullContent) {
    const limitedDescription = truncateText(dbRpg.description, 400)
    const createdAtLabel = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long",
      timeZone: "America/Sao_Paulo",
    }).format(dbRpg.createdAt)
    const membersCount = 0

    return (
      <div className={styles.container}>
        <div className={styles.topActions}>
          <RpgInfoModalButton
            title={dbRpg.title}
            description={limitedDescription}
            masterName={dbRpg.ownerName}
            visibility={dbRpg.visibility}
            createdAt={createdAtLabel}
            membersCount={membersCount}
          />
        </div>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{dbRpg.title}</h2>
        </div>
        <MembershipNotifications
          rpgId={dbRpg.id}
          isOwner={isOwner}
          isAuthenticated={isAuthenticated}
          membershipStatus={membershipStatus}
          pendingRequests={[]}
          pendingCharacterRequests={[]}
          simpleJoin
        />
      </div>
    )
  }

  const limitedDescription = truncateText(dbRpg.description, 400)
  const createdAtLabel = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeZone: "America/Sao_Paulo",
  }).format(dbRpg.createdAt)
  const membersCount = acceptedMembersCount

  return (
    <div className={styles.container}>
      <div className={styles.topActions}>
        <MembershipNotifications
          rpgId={dbRpg.id}
          isOwner={canManageRpg}
          isAuthenticated={isAuthenticated}
          membershipStatus={membershipStatus}
          pendingRequests={pendingRequests.map((item) => ({
            ...item,
            requestedAt: item.requestedAt.toISOString(),
          }))}
          pendingCharacterRequests={pendingCharacterRequests.map((item) => ({
            ...item,
            requestedAt: item.requestedAt.toISOString(),
          }))}
          compact
        />
        {canManageRpg ? <QuickCreateMenu rpgId={dbRpg.id} /> : null}
        {canManageRpg ? (
          <MembersList
            rpgId={dbRpg.id}
            members={acceptedMembers}
            compact
            usersCanManageOwnXp={dbRpg.usersCanManageOwnXp}
            allowSkillPointDistribution={dbRpg.allowSkillPointDistribution}
          />
        ) : null}
        <RpgInfoModalButton
          title={dbRpg.title}
          description={limitedDescription}
          masterName={dbRpg.ownerName}
          visibility={dbRpg.visibility}
          createdAt={createdAtLabel}
          membersCount={membersCount}
        />
        {canManageRpg ? (
          <Link
            href={`/rpg/${dbRpg.id}/edit`}
            className={styles.settingsButton}
            aria-label="Configurar RPG"
            title="Configurar RPG"
          >
            <Settings size={18} />
          </Link>
        ) : null}
      </div>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>{dbRpg.title}</h2>
      </div>

      {isOwner ? (
        <SpectatorVisionPanel
          rpgId={dbRpg.id}
          characters={spectatorCharacters}
          attributeLabels={attributeLabels}
          skillLabels={skillLabels}
          statusLabels={statusLabels}
        />
      ) : null}

      <h3 className={styles.sectionTitle}>Sessoes</h3>

      <div className={styles.cards}>
        <Link href={`/rpg/${dbRpg.id}/characters`} className={styles.card}>
          <Image
            src="/images/bg-characters.jpg"
            alt="Personagens"
            fill
            className={styles.cardImage}
          />
          <span>Personagens</span>
        </Link>

        {hasRaces ? (
          <Link href={`/rpg/${dbRpg.id}/races`} className={styles.card}>
            <Image
              src="/images/bg-races.jpg"
              alt="Racas"
              fill
              className={styles.cardImage}
            />
            <span>Racas</span>
          </Link>
        ) : null}

        {hasClasses ? (
          <Link href={`/rpg/${dbRpg.id}/classes`} className={styles.card}>
            <Image
              src="/images/bg-classes.webp"
              alt="Classes"
              fill
              className={styles.cardImage}
            />
            <span>Classes</span>
          </Link>
        ) : null}

        {dbRpg.useMundiMap ? (
          <Link href={`/rpg/${dbRpg.id}/map`} className={styles.card}>
            <Image
              src="/images/bg-regions.jpg"
              alt="Mapa Mundi"
              fill
              className={styles.cardImage}
            />
            <span>Mapa Mundi</span>
          </Link>
        ) : null}

        {canManageRpg ? (
          <Link href={`/rpg/${dbRpg.id}/items`} className={styles.card}>
            <Image
              src="/images/bg-items.png"
              alt="Itens"
              fill
              className={styles.cardImage}
            />
            <span>Items</span>
          </Link>
        ) : null}

        <Link href={`/rpg/${dbRpg.id}/library`} className={styles.card}>
          <Image
            src="/images/bg-library.jpg"
            alt="Biblioteca"
            fill
            className={styles.cardImage}
          />
          <span>Biblioteca</span>
        </Link>

      </div>
    </div>
  )
}
