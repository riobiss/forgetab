import Link from "next/link"
import { items } from "@/data/rpg/world-of-clans/items/items"
import styles from "./page.module.css"

type Params = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function ItemsPage({ params }: Params) {
  const { rpgId } = await params

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Sessao avancada</p>
          <h1 className={styles.title}>Itens do RPG</h1>
          <p className={styles.subtitle}>
            Organize os itens principais e use esta sessao como base para inventarios.
          </p>
        </div>
        <Link href={`/rpg/${rpgId}/edit`} className={styles.backLink}>
          Voltar para edicao
        </Link>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Catalogo</h2>

        <div className={styles.grid}>
          {items.map((item) => (
            <article key={item.id} className={`${styles.card} ${styles[item.rarity]}`}>
              <div className={styles.cardHeader}>
                <h3>{item.name}</h3>
                <span>{item.rarity}</span>
              </div>
              <p>{item.description}</p>
              <small>Quantidade base: {item.quantity}</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
