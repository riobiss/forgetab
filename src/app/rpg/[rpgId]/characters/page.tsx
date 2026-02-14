import rpgs from "@/data/rpgs"
import { PlayerCharacter } from "@/types/PlayerCharacter"
import Image from "next/image"
import styles from "./page.module.css"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Prisma } from "../../../../../generated/prisma/client"
import { cookies } from "next/headers"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import { notFound } from "next/navigation"

type Params = {
  params: Promise<{
    rpgId: string
  }>
}

type DbCharacterRow = {
  id: string
  name: string
  attributes: Prisma.JsonValue
}

type MemberStatusRow = {
  status: "pending" | "accepted" | "rejected"
}

async function getUserIdFromCookie() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    const payload = await verifyAuthToken(token)
    return payload.userId
  } catch {
    return null
  }
}

export default async function CharactersPage({ params }: Params) {
  const { rpgId } = await params

  let dbRpg:
    | { id: string; ownerId: string; visibility: "private" | "public" }
    | null = null
  let dbCharacters: DbCharacterRow[] = []
  let privateBlocked = false

  const userId = await getUserIdFromCookie()

  try {
    dbRpg = await prisma.rpg.findUnique({
      where: { id: rpgId },
      select: { id: true, ownerId: true, visibility: true },
    })

    if (dbRpg) {
      const isOwner = userId === dbRpg.ownerId
      let isAcceptedMember = false

      if (userId && !isOwner) {
        const membership = await prisma.$queryRaw<MemberStatusRow[]>(Prisma.sql`
          SELECT status
          FROM rpg_members
          WHERE rpg_id = ${rpgId}
            AND user_id = ${userId}
          LIMIT 1
        `)

        isAcceptedMember = membership[0]?.status === "accepted"
      }

      if (dbRpg.visibility === "private" && !isOwner && !isAcceptedMember) {
        privateBlocked = true
      } else {
        dbCharacters = await prisma.$queryRaw<DbCharacterRow[]>(Prisma.sql`
          SELECT id, name, attributes
          FROM rpg_characters
          WHERE rpg_id = ${rpgId}
          ORDER BY created_at DESC
        `)
      }
    }
  } catch {
    dbRpg = null
    dbCharacters = []
  }

  if (privateBlocked) {
    notFound()
  }

  const staticRpg = rpgs.find((r) => r.id === Number(rpgId))
  const staticCharacters = staticRpg
    ? (staticRpg.charactersData as PlayerCharacter[])
    : []

  if (!dbRpg && !staticRpg) {
    return <div>RPG nao encontrado</div>
  }

  const canCreateCharacter = Boolean(dbRpg && userId === dbRpg.ownerId)

  return (
    <main className={styles.container}>
      <div className={styles.topbar}>
        <h1 className={styles.title}>Personagens</h1>

        {canCreateCharacter ? (
          <Link href={`/rpg/${rpgId}/characters/novo`} className={styles.createButton}>
            Criar personagem
          </Link>
        ) : null}
      </div>

      {dbCharacters.length > 0 ? (
        <section className={styles.dbSection}>
          <h2>Personagens criados no seu RPG</h2>
          <div className={styles.dbGrid}>
            {dbCharacters.map((character) => (
              <article key={character.id} className={styles.dbCard}>
                <h3>{character.name}</h3>
                <p>
                  {
                    Object.keys(
                      (character.attributes as Record<string, unknown>) ?? {},
                    ).length
                  }{" "}
                  atributos configurados
                </p>
                <Link href={`/rpg/${rpgId}/characters/${character.id}`}>
                  Ver ficha
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {staticCharacters.length > 0 ? (
        <section>
          <h2 className={styles.sectionTitle}>Personagens do conteudo base</h2>
          <div className={styles.grid}>
            {staticCharacters.map((c) => (
              <article key={c.id} className={styles.card}>
                <Link href={`/rpg/${staticRpg?.id}/characters/${c.id}`}>
                  <Image
                    src={c.image}
                    alt={`Imagem do personagem ${c.identity.name}`}
                    fill
                    className={styles.image}
                    priority
                    sizes="(max-width: 1099px) 50vw, 33vw"
                  />
                  <div className={styles.overlay}>
                    <h2 className={styles.name}>{c.identity.name}</h2>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {dbCharacters.length === 0 && staticCharacters.length === 0 ? (
        <p className={styles.emptyState}>Nenhum personagem encontrado.</p>
      ) : null}
    </main>
  )
}
