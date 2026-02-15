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
import { STATUS_CATALOG } from "@/lib/rpg/statusCatalog"
import CharacterDeleteButton from "./components/CharacterDeleteButton"
import CharacterCreationPermission from "./components/CharacterCreationPermission"

type Params = {
  params: Promise<{
    rpgId: string
  }>
  searchParams: Promise<{
    type?: string
  }>
}

type DbCharacterRow = {
  id: string
  name: string
  characterType: "player" | "npc" | "monster"
  visibility: "private" | "public"
  createdByUserId: string | null
  life: number
  defense: number
  mana: number
  stamina: number
  sanity: number
  statuses: Prisma.JsonValue
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

const statusLabelByKey = new Map(STATUS_CATALOG.map((item) => [item.key, item.label]))

export default async function CharactersPage({ params, searchParams }: Params) {
  const { rpgId } = await params
  const resolvedSearchParams = await searchParams
  const filterType =
    resolvedSearchParams?.type === "player" ||
    resolvedSearchParams?.type === "npc" ||
    resolvedSearchParams?.type === "monster"
      ? resolvedSearchParams.type
      : "all"

  let dbRpg:
    | { id: string; ownerId: string; visibility: "private" | "public" }
    | null = null
  let dbCharacters: DbCharacterRow[] = []
  let privateBlocked = false
  let canCreateCharacter = false
  let isOwner = false
  let isAcceptedMember = false
  let ownCharacterId: string | null = null

  const userId = await getUserIdFromCookie()

  try {
    dbRpg = await prisma.rpg.findUnique({
      where: { id: rpgId },
      select: { id: true, ownerId: true, visibility: true },
    })

    if (dbRpg) {
      isOwner = userId === dbRpg.ownerId

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
        canCreateCharacter = Boolean(userId && (isOwner || isAcceptedMember))

        dbCharacters = await prisma.$queryRaw<DbCharacterRow[]>(Prisma.sql`
          SELECT
            id,
            name,
            character_type AS "characterType",
            visibility,
            created_by_user_id AS "createdByUserId",
            life,
            defense,
            mana,
            stamina,
            sanity,
            statuses,
            attributes
          FROM rpg_characters
          WHERE rpg_id = ${rpgId}
            ${
              isOwner
                ? Prisma.empty
                : userId
                  ? Prisma.sql`AND (visibility = 'public'::"RpgVisibility" OR created_by_user_id = ${userId})`
                  : Prisma.sql`AND visibility = 'public'::"RpgVisibility"`
            }
            ${
              filterType !== "all"
                ? Prisma.sql`AND character_type = ${filterType}::"RpgCharacterType"`
                : Prisma.empty
            }
          ORDER BY created_at DESC
        `)

        if (userId) {
          const ownCharacter = dbCharacters.find(
            (character) =>
              character.characterType === "player" &&
              character.createdByUserId === userId,
          )
          ownCharacterId = ownCharacter?.id ?? null
        }
      }
    }
  } catch {
    dbRpg = null
    dbCharacters = []
    canCreateCharacter = false
    isOwner = false
    isAcceptedMember = false
    ownCharacterId = null
  }

  if (privateBlocked) {
    notFound()
  }

  const staticRpg = rpgs.find((r) => r.id === Number(rpgId))
  const staticCharactersRaw = staticRpg
    ? (staticRpg.charactersData as PlayerCharacter[])
    : []
  const staticCharacters =
    filterType === "all" || filterType === "player" ? staticCharactersRaw : []

  if (!dbRpg && !staticRpg) {
    return <div>RPG nao encontrado</div>
  }

  return (
    <main className={styles.container}>
      <div className={styles.topbar}>
        <h1 className={styles.title}>Personagens</h1>

        {canCreateCharacter && isOwner ? (
          <Link href={`/rpg/${rpgId}/characters/novo`} className={styles.createButton}>
            Criar personagem
          </Link>
        ) : null}
      </div>

      <div className={styles.filters}>
        <Link
          href={`/rpg/${rpgId}/characters`}
          className={`${styles.filterButton} ${filterType === "all" ? styles.filterActive : ""}`}
        >
          Todos
        </Link>
        <Link
          href={`/rpg/${rpgId}/characters?type=player`}
          className={`${styles.filterButton} ${filterType === "player" ? styles.filterActive : ""}`}
        >
          Player
        </Link>
        <Link
          href={`/rpg/${rpgId}/characters?type=npc`}
          className={`${styles.filterButton} ${filterType === "npc" ? styles.filterActive : ""}`}
        >
          NPC
        </Link>
        <Link
          href={`/rpg/${rpgId}/characters?type=monster`}
          className={`${styles.filterButton} ${filterType === "monster" ? styles.filterActive : ""}`}
        >
          Monstro
        </Link>
      </div>

      {canCreateCharacter ? (
        <CharacterCreationPermission
          rpgId={rpgId}
          isOwner={isOwner}
          isAcceptedMember={isAcceptedMember}
          ownCharacterId={ownCharacterId}
        />
      ) : null}

      {dbCharacters.length > 0 ? (
        <section className={styles.dbSection}>
          <h2>Personagens criados no seu RPG</h2>
          <div className={styles.dbGrid}>
            {dbCharacters.map((character) => (
              <article key={character.id} className={styles.dbCard}>
                <h3>{character.name}</h3>
                <p className={styles.typeBadge}>
                  Tipo:{" "}
                  {character.characterType === "player"
                    ? "Player"
                    : character.characterType === "npc"
                      ? "NPC"
                      : "Monstro"}
                </p>
                <p className={styles.typeBadge}>
                  Visibilidade: {character.visibility === "private" ? "Privado" : "Publico"}
                </p>
                <div className={styles.statsGrid}>
                  {Object.entries((character.statuses as Record<string, number>) ?? {}).map(
                    ([key, value]) => (
                      <p key={key}>
                        {statusLabelByKey.get(key) ?? key}: {value}
                      </p>
                    ),
                  )}
                </div>
                <p>
                  {Object.keys((character.attributes as Record<string, unknown>) ?? {}).length}{" "}
                  atributos configurados
                </p>
                <div className={styles.cardActions}>
                  <Link href={`/rpg/${rpgId}/characters/${character.id}`}>Ver ficha</Link>
                  {userId &&
                  (dbRpg?.ownerId === userId || character.createdByUserId === userId) ? (
                    <Link href={`/rpg/${rpgId}/characters/novo?characterId=${character.id}`}>
                      Editar
                    </Link>
                  ) : null}
                  {userId &&
                  (dbRpg?.ownerId === userId || character.createdByUserId === userId) ? (
                    <CharacterDeleteButton rpgId={rpgId} characterId={character.id} />
                  ) : null}
                </div>
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
