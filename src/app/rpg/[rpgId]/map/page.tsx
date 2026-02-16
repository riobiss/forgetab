import { notFound } from "next/navigation"
import { Prisma } from "../../../../../generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { getMembershipStatus } from "@/lib/server/rpgAccess"
import rpgs from "@/data/rpgs"
import { MundiMap } from "./components/mundi-map/MundiMap"
import styles from "./page.module.css"

type Params = {
  params: Promise<{
    rpgId: string
  }>
}

type RpgMapRow = {
  id: string
  ownerId: string
  visibility: "private" | "public"
  useMundiMap: boolean
  mapImage: string | null
}

export default async function MapPage({ params }: Params) {
  const { rpgId } = await params
  const staticRpg = rpgs.find((r) => r.id === Number(rpgId))

  if (staticRpg) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Mapa Mundi</h1>
        <MundiMap rpgId={String(staticRpg.id)} isOwner={false} initialMapSrc={null} />
        <section className={styles.extraArea}>
          <h2 className={styles.extraTitle}>Regioes</h2>
          <p className={styles.extraText}>Todos os jogadores podem visualizar o mapa.</p>
        </section>
      </div>
    )
  }

  let rows: RpgMapRow[] = []
  try {
    rows = await prisma.$queryRaw<RpgMapRow[]>(Prisma.sql`
      SELECT
        id,
        owner_id AS "ownerId",
        visibility,
        COALESCE(use_mundi_map, false) AS "useMundiMap",
        map_image AS "mapImage"
      FROM rpgs
      WHERE id = ${rpgId}
      LIMIT 1
    `)
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('column "map_image" does not exist') ||
        error.message.includes('column "use_mundi_map" does not exist'))
    ) {
      rows = await prisma.$queryRaw<RpgMapRow[]>(Prisma.sql`
        SELECT
          id,
          owner_id AS "ownerId",
          visibility,
          false AS "useMundiMap",
          null::text AS "mapImage"
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
  const isOwner = userId === dbRpg.ownerId
  let isAcceptedMember = false

  if (userId && !isOwner) {
    isAcceptedMember = (await getMembershipStatus(rpgId, userId)) === "accepted"
  }

  if (dbRpg.visibility === "private" && !isOwner && !isAcceptedMember) {
    notFound()
  }

  if (!dbRpg.useMundiMap) {
    notFound()
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Mapa Mundi</h1>
      <MundiMap rpgId={rpgId} isOwner={isOwner} initialMapSrc={dbRpg.mapImage} />
      <section className={styles.extraArea}>
        <h2 className={styles.extraTitle}>Regioes</h2>
        <p className={styles.extraText}>
          {isOwner
            ? "Voce pode enviar a imagem do mapa e ajustar no modo de mapa completo."
            : "Somente o owner pode alterar a imagem. Todos os membros podem visualizar o mapa."}
        </p>
      </section>
    </div>
  )
}
