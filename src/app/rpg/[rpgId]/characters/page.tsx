import Image from "next/image"
import styles from "./page.module.css"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Prisma } from "../../../../../generated/prisma/client.js"
import { notFound } from "next/navigation"
import CharacterCreationPermission from "./components/CharacterCreationPermission"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { getMembershipStatus } from "@/lib/server/rpgAccess"

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
  image: string | null
  characterType: "player" | "npc" | "monster"
  createdByUserId: string | null
}

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

  const userId = await getUserIdFromCookieStore()

  try {
    dbRpg = await prisma.rpg.findUnique({
      where: { id: rpgId },
      select: { id: true, ownerId: true, visibility: true },
    })

    if (dbRpg) {
      isOwner = userId === dbRpg.ownerId

      if (userId && !isOwner) {
        isAcceptedMember = (await getMembershipStatus(rpgId, userId)) === "accepted"
      }

      if (dbRpg.visibility === "private" && !isOwner && !isAcceptedMember) {
        privateBlocked = true
      } else {
        canCreateCharacter = Boolean(userId && (isOwner || isAcceptedMember))

        dbCharacters = await prisma.$queryRaw<DbCharacterRow[]>(Prisma.sql`
          SELECT
            id,
            name,
            image,
            character_type AS "characterType",
            created_by_user_id AS "createdByUserId"
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

  if (!dbRpg) {
    notFound()
  }

  return (
    <main className={styles.container}>
      <div className={styles.topbar}>
        <h1 className={styles.title}>Personagens</h1>

        {canCreateCharacter && isOwner ? (
          <div className={styles.topActions}>
            <Link href={`/rpg/${rpgId}/characters/novo`} className={styles.createButton}>
              Criar personagem
            </Link>
          </div>
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
          <div className={styles.grid}>
            {dbCharacters.map((character) => (
              <article key={character.id} className={styles.card}>
                <Link href={`/rpg/${rpgId}/characters/${character.id}`}>
                  <Image
                    src={character.image ?? "/images/bg-characters.jpg"}
                    alt={`Imagem do personagem ${character.name}`}
                    fill
                    className={styles.image}
                    priority
                    sizes="(max-width: 1099px) 50vw, 33vw"
                  />
                  <div className={styles.overlay}>
                    <h2 className={styles.name}>{character.name}</h2>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {dbCharacters.length === 0 ? (
        <p className={styles.emptyState}>Nenhum personagem encontrado.</p>
      ) : null}
    </main>
  )
}
