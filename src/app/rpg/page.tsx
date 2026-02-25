import styles from "./page.module.css"
import Link from "next/link"
import Image from "next/image"
import { Plus } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import { formatDateInBrasilia } from "@/lib/date"

type CreatedRpg = {
  id: string
  title: string
  description: string
  image: string | null
  visibility: "private" | "public"
  createdAt: Date
}

export default async function ViewRpg() {
  let createdRpgs: CreatedRpg[] = []
  let publicRpgs: CreatedRpg[] = []
  let userId: string | null = null

  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value

    if (token) {
      const payload = await verifyAuthToken(token)
      userId = payload.userId
    }
  } catch {
    userId = null
  }

  try {
    if (userId) {
      createdRpgs = await prisma.rpg.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          title: true,
          description: true,
          image: true,
          visibility: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      })
    }

    publicRpgs = await prisma.rpg.findMany({
      where: userId
        ? { visibility: "public", ownerId: { not: userId } }
        : { visibility: "public" },
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        visibility: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })
  } catch {
    createdRpgs = []
    publicRpgs = []
  }

  return (
    <div className={styles.container}>
      <div className={styles.topbar}>
        <h2 className={styles.title}>RPGs</h2>
        <Link href="/rpg/new" className={styles.createButton}>
          <Plus size={16} />
          <span>Criar RPG</span>
        </Link>
      </div>

      {userId ? (
        <section className={styles.createdSection}>
          <h3 className={styles.sectionTitle}>Seus RPGs</h3>

          {createdRpgs.length > 0 ? (
            <div className={styles.createdGrid}>
              {createdRpgs.map((item) => (
                <Link
                  key={item.id}
                  href={`/rpg/${item.id}`}
                  className={styles.createdCard}
                >
                  {item.image ? (
                    <div className={styles.createdCardImageWrap}>
                      <Image
                        src={item.image}
                        alt={`Capa do RPG ${item.title}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 360px"
                        unoptimized
                        className={styles.createdCardImage}
                      />
                    </div>
                  ) : null}
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                  <small>
                    {item.visibility === "public" ? "Publico" : "Privado"} |{" "}
                    {formatDateInBrasilia(item.createdAt)}
                  </small>
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.authMessage}>Voce ainda nao criou RPGs.</p>
          )}
        </section>
      ) : (
        <p className={styles.authMessage}>
          Faca login para ver os RPGs que voce criou.
        </p>
      )}

      {publicRpgs.length > 0 ? (
        <section className={styles.createdSection}>
          <h3 className={styles.sectionTitle}>RPGs Publicos</h3>
          <div className={styles.createdGrid}>
            {publicRpgs.map((item) => (
              <Link
                key={item.id}
                href={`/rpg/${item.id}`}
                className={styles.createdCard}
              >
                {item.image ? (
                  <div className={styles.createdCardImageWrap}>
                    <Image
                      src={item.image}
                      alt={`Capa do RPG ${item.title}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 360px"
                      unoptimized
                      className={styles.createdCardImage}
                    />
                  </div>
                ) : null}
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <small>
                  Publico | {formatDateInBrasilia(item.createdAt)}
                </small>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

    </div>
  )
}
