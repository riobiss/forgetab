import rpgs from "@/data/rpgs"
import Image from "next/image"
import Link from "next/link"
import slugify from "@/utils/slugify"
import styles from "./page.module.css"
import { prisma } from "@/lib/prisma"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { getMembershipStatus } from "@/lib/server/rpgAccess"
import { notFound } from "next/navigation"

type Params = {
  params: Promise<{
    rpgId: string
  }>
}

type DbRaceRow = {
  id: string
  key: string
  label: string
}

export default async function RacesPage({ params }: Params) {
  const { rpgId } = await params

  const rpg = rpgs.find((r) => r.id === Number(rpgId))
  if (rpg) {
    return (
      <main className={styles.container}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Raças</h1>
        </div>

        <section className={styles.grid}>
          {rpg.races?.map((race) => (
            <article key={race.id} className={styles.card}>
              <Link href={`/rpg/${rpg.id}/races/${slugify(race.name)}`}>
                <Image
                  src={race.img}
                  alt={`Imagem da raça ${race.name}`}
                  fill
                  className={styles.image}
                />
                <h2>{race.name}</h2>
              </Link>
            </article>
          ))}
        </section>
      </main>
    )
  }

  const dbRpg = await prisma.rpg.findUnique({
    where: { id: rpgId },
    select: { id: true, ownerId: true, visibility: true },
  })

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

  let dbRaces: DbRaceRow[] = []
  try {
    dbRaces = await prisma.$queryRaw<DbRaceRow[]>`
      SELECT id, key, label
      FROM rpg_race_templates
      WHERE rpg_id = ${rpgId}
      ORDER BY position ASC
    `
  } catch {
    dbRaces = []
  }

  return (
    <main className={styles.container}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>Raças</h1>
        {isOwner ? (
          <Link className={styles.manageButton} href={`/rpg/${rpgId}/edit/advanced/race/new`}>
            Criar raca
          </Link>
        ) : null}
      </div>

      <section className={styles.grid}>
        {dbRaces.map((race) => (
          <article key={race.id} className={styles.card}>
            <h2>{race.label}</h2>
            {isOwner ? (
              <div className={styles.cardActions}>
                <Link
                  className={styles.editButton}
                  href={`/rpg/${rpgId}/edit/advanced/race/${race.key}`}
                >
                  Editar
                </Link>
              </div>
            ) : null}
          </article>
        ))}
      </section>

      {dbRaces.length === 0 ? <p>Nenhuma raça cadastrada.</p> : null}
    </main>
  )
}

