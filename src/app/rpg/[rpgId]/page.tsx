import rpgs from "@/data/rpgs"
import { notFound } from "next/navigation"
import styles from "./page.module.css"
import Image from "next/image"
import Link from "next/link"
import { Settings } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Prisma } from "../../../../generated/prisma/client"
import MembershipNotifications from "./components/MembershipNotifications"
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

type AcceptedMemberRow = {
  id: string
  userName: string
  userEmail: string
}

type CountRow = {
  total: bigint | number
}

export const generateMetadata = () => {
  return {
    title: "rpg",
  }
}

export default async function ViewInRpg({ params }: Params) {
  const { rpgId } = await params
  const staticRpg = rpgs.find((r) => r.id === Number(rpgId))

  if (staticRpg) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>{staticRpg.name}</h2>
        <p className={styles.description}>{staticRpg.description}</p>

        <h3 className={styles.sectionTitle}>Cronicas do Mundo</h3>

        <div className={styles.cards}>
          <div className={styles.card}>
            <Image
              src="/images/bg-library.jpg"
              alt="Biblioteca"
              fill
              className={styles.cardImage}
            />
            <span>Biblioteca</span>
          </div>

          <Link href={`/rpg/${staticRpg.id}/map`} className={styles.card}>
            <Image
              src="/images/bg-regioes.jpg"
              alt="Regioes"
              fill
              className={styles.cardImage}
            />
            <span>Regioes</span>
          </Link>

          <Link href={`/rpg/${staticRpg.id}/races`} className={styles.card}>
            <Image
              src="/images/bg-races.jpg"
              alt="Racas"
              fill
              className={styles.cardImage}
            />
            <span>Racas</span>
          </Link>
          <Link href={`/rpg/${staticRpg.id}/characters`} className={styles.card}>
            <Image
              src="/images/bg-characters.jpg"
              alt="Personagens"
              fill
              className={styles.cardImage}
            />
            <span>Personagens</span>
          </Link>
          <Link href={`/rpg/${staticRpg.id}/classes`} className={styles.card}>
            <Image
              src="/images/bg-classes.webp"
              alt="Classes"
              fill
              className={styles.cardImage}
            />
            <span>Classes</span>
          </Link>
        </div>
      </div>
    )
  }

  const dbRpg = await prisma.rpg.findUnique({
    where: { id: rpgId },
    select: {
      id: true,
      ownerId: true,
      title: true,
      description: true,
      visibility: true,
    },
  })

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

  if (dbRpg.visibility === "private" && !isOwner && !isAcceptedMember) {
    notFound()
  }

  let pendingRequests: PendingRequestRow[] = []
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
          acceptedMembers={acceptedMembers}
          compact
        />
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
          <div className={styles.card}>
            <Image
              src="/images/bg-classes.webp"
              alt="Classes"
              fill
              className={styles.cardImage}
            />
            <span>Classes</span>
          </div>
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
