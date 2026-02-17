import { notFound } from "next/navigation"
import styles from "./page.module.css"
import Image from "next/image"
import Link from "next/link"
import { Settings } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Prisma } from "../../../../generated/prisma/client"
import MembershipNotifications from "./components/MembershipNotifications"
import MembersList from "./components/MembersList"
import QuickCreateMenu from "./components/QuickCreateMenu"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { getMembershipStatus } from "@/lib/server/rpgAccess"

type Params = {
  params: Promise<{
    rpgId: string
  }>
}

type PendingRequestRow = {
  id: string
  userName: string
  userEmail: string
  requestedAt: Date
}

type PendingCharacterRequestRow = {
  id: string
  userName: string
  userEmail: string
  requestedAt: Date
}

type AcceptedMemberRow = {
  id: string
  userName: string
  userEmail: string
}

type CountRow = {
  total: bigint | number
}

type DbRpgRow = {
  id: string
  ownerId: string
  title: string
  description: string
  visibility: "private" | "public"
  useMundiMap: boolean
}

export const generateMetadata = () => {
  return {
    title: "rpg",
  }
}

export default async function ViewInRpg({ params }: Params) {
  const { rpgId } = await params

  let rows: DbRpgRow[] = []
  try {
    rows = await prisma.$queryRaw<DbRpgRow[]>(Prisma.sql`
      SELECT
        id,
        owner_id AS "ownerId",
        title,
        description,
        visibility,
        COALESCE(use_mundi_map, false) AS "useMundiMap"
      FROM rpgs
      WHERE id = ${rpgId}
      LIMIT 1
    `)
  } catch (error) {
    if (error instanceof Error && error.message.includes('column "use_mundi_map" does not exist')) {
      rows = await prisma.$queryRaw<DbRpgRow[]>(Prisma.sql`
        SELECT
          id,
          owner_id AS "ownerId",
          title,
          description,
          visibility,
          false AS "useMundiMap"
        FROM rpgs
        WHERE id = ${rpgId}
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
  const isOwner = userId === dbRpg.ownerId

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
  let hasRaces = false
  let hasClasses = false

  if (isOwner) {
    pendingRequests = await prisma.$queryRaw<PendingRequestRow[]>(Prisma.sql`
      SELECT
        m.id,
        u.name AS "userName",
        u.email AS "userEmail",
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
        u.name AS "userName",
        u.email AS "userEmail"
      FROM rpg_members m
      INNER JOIN users u ON u.id = m.user_id
      WHERE m.rpg_id = ${rpgId}
        AND m.status = 'accepted'::"public"."RpgMemberStatus"
      ORDER BY u.name ASC
    `)

    pendingCharacterRequests = await prisma.$queryRaw<PendingCharacterRequestRow[]>(Prisma.sql`
      SELECT
        r.id,
        u.name AS "userName",
        u.email AS "userEmail",
        r.requested_at AS "requestedAt"
      FROM rpg_character_creation_requests r
      INNER JOIN users u ON u.id = r.user_id
      WHERE r.rpg_id = ${rpgId}
        AND r.status = 'pending'::"public"."CharacterCreationRequestStatus"
      ORDER BY r.requested_at ASC
    `)
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

  if (!canViewFullContent) {
    return (
      <div className={styles.container}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{dbRpg.title}</h2>
        </div>
        <p className={styles.description}>{dbRpg.description}</p>
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

  return (
    <div className={styles.container}>
      <div className={styles.topActions}>
        <MembershipNotifications
          rpgId={dbRpg.id}
          isOwner={isOwner}
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
        {isOwner ? <QuickCreateMenu rpgId={dbRpg.id} /> : null}
        {isOwner ? (
          <MembersList rpgId={dbRpg.id} members={acceptedMembers} compact />
        ) : null}
        {isOwner ? (
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
      <p className={styles.description}>{dbRpg.description}</p>

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
              src="/images/bg-regioes.jpg"
              alt="Mapa Mundi"
              fill
              className={styles.cardImage}
            />
            <span>Mapa Mundi</span>
          </Link>
        ) : null}

        {isOwner ? (
          <>
            <Link href={`/rpg/${dbRpg.id}/items`} className={styles.card}>
              <Image
                src="/images/bg-mine.png"
                alt="Itens"
                fill
                className={styles.cardImage}
              />
              <span>Itens</span>
            </Link>
          </>
        ) : null}
      </div>
    </div>
  )
}
