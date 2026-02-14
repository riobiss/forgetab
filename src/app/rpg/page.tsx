import rpg from "@/data/rpgs"
import Image from "next/image"
import styles from "./page.module.css"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

type CreatedRpg = {
  id: string
  title: string
  description: string
  visibility: "private" | "public"
  createdAt: Date
}

export default async function ViewRpg() {
  let createdRpgs: CreatedRpg[] = []

  try {
    createdRpgs = await prisma.rpg.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        visibility: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })
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

      {createdRpgs.length > 0 ? (
        <section className={styles.createdSection}>
          <h3 className={styles.sectionTitle}>Criados por usuarios</h3>

          <div className={styles.createdGrid}>
            {createdRpgs.map((item) => (
              <article key={item.id} className={styles.createdCard}>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <small>
                  {item.visibility === "public" ? "Publico" : "Privado"} |{" "}
                  {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                </small>
              </article>
            ))}
          </div>
        </section>
      ) : null}

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
