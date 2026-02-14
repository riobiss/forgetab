import rpgs from "@/data/rpgs"
import { notFound } from "next/navigation"
import styles from "./page.module.css"
import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"

type Params = {
  params: Promise<{
    rpgId: string
  }>
}

export const generateMetadata = () => {
  return {
    title: "rpg",
  }
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

export default async function ViewInRpg({ params }: Params) {
  const { rpgId } = await params
  const staticRpg = rpgs.find((r) => r.id === Number(rpgId))

  if (staticRpg) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>{staticRpg.name}</h2>
        <p className={styles.description}>{staticRpg.description}</p>

        <h3 className={styles.sectionTitle}>Crônicas do Mundo</h3>

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
              alt="Regiões"
              fill
              className={styles.cardImage}
            />
            <span>Regiões</span>
          </Link>

          <Link href={`/rpg/${staticRpg.id}/races`} className={styles.card}>
            <Image
              src="/images/bg-races.jpg"
              alt="Raças"
              fill
              className={styles.cardImage}
            />
            <span>Raças</span>
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

  const userId = await getUserIdFromCookie()
  const isOwner = userId === dbRpg.ownerId

  if (dbRpg.visibility === "private" && !isOwner) {
    notFound()
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{dbRpg.title}</h2>
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

        <Link href={`/rpg/${dbRpg.id}/items`} className={styles.card}>
          <Image
            src="/images/bg-library.jpg"
            alt="Itens"
            fill
            className={styles.cardImage}
          />
          <span>Itens</span>
        </Link>

        {isOwner ? (
          <Link href={`/rpg/${dbRpg.id}/edit`} className={styles.card}>
            <Image
              src="/images/bg-classes.webp"
              alt="Editar RPG"
              fill
              className={styles.cardImage}
            />
            <span>Editar RPG</span>
          </Link>
        ) : null}
      </div>
    </div>
  )
}
