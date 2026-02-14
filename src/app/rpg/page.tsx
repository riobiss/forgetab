import rpg from "@/data/rpgs"
import Image from "next/image"
import styles from "./page.module.css"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import OwnedRpgActions from "./components/OwnedRpgActions"

type CreatedRpg = {
  id: string
  title: string
  description: string
  visibility: "private" | "public"
  createdAt: Date
}

export default async function ViewRpg() {
  let createdRpgs: CreatedRpg[] = []
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
          visibility: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      })
    }
  } catch {
    createdRpgs = []
  }

  return (
    <div className={styles.container}>
      <div className={styles.topbar}>
        <h2 className={styles.title}>RPGs</h2>
        <Link href="/rpg/novo" className={styles.createButton}>
          Criar RPG
        </Link>
      </div>

      {userId ? (
        <section className={styles.createdSection}>
          <h3 className={styles.sectionTitle}>Seus RPGs</h3>

          {createdRpgs.length > 0 ? (
            <div className={styles.createdGrid}>
              {createdRpgs.map((item) => (
                <article key={item.id} className={styles.createdCard}>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                  <small>
                    {item.visibility === "public" ? "Publico" : "Privado"} |{" "}
                    {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                  </small>

                  <OwnedRpgActions rpgId={item.id} />
                </article>
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

      <main className={styles.containerMain}>
        {rpg.map((item) => (
          <Link
            href={`/rpg/${item.id}`}
            key={item.id}
            className={styles.containerRpg}
          >
            <div className={styles.imageWrapper}>
              <Image
                src={item.image}
                width={300}
                height={420}
                alt={item.name}
              />
            </div>

            <h3 className={styles.rpgTitle}>{item.name}</h3>

            <p className={styles.rpgDescription}>{item.description}</p>
          </Link>
        ))}
      </main>
    </div>
  )
}
